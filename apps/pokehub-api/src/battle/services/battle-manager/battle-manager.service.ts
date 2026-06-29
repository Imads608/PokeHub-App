import {
  TURN_TIMER_SERVICE,
  type ITurnTimerService,
} from '../turn-timer/turn-timer.service.interface';
import {
  BATTLE_MANAGER_SERVICE,
  type ActiveBattle,
  type IBattleManagerService,
} from './battle-manager.service.interface';
import type { Provider } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { BattleStreams } from '@pkmn/sim';
import {
  REDIS_SERVICE,
  type RedisService,
} from '@pokehub/backend/pokehub-redis';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { BattleConfig } from '@pokehub/shared/pokemon-battle-types';

// Disconnect timeout in milliseconds (2 minutes)
const DISCONNECT_TIMEOUT_MS = 2 * 60 * 1000;

// Safety-net TTL for battle Redis keys (24 hours).
// Active battles finish well before this. Ensures orphaned keys from
// server crashes (where no player reconnects) are eventually cleaned up.
const BATTLE_KEY_TTL_SECONDS = 24 * 60 * 60;

/**
 * Battle Manager Service
 *
 * Manages active battles using @pkmn/sim's BattleStream protocol.
 * - Creates battles from matched players
 * - Processes player choices
 * - Handles disconnects/reconnects
 * - Recovers battles from Redis after server crash
 */
@Injectable()
class BattleManagerService implements IBattleManagerService {
  /** Map of battle ID -> active battle instance */
  private readonly battles = new Map<string, BattleInstance>();

  /** Map of "battleId:playerId" -> disconnect timeout handle */
  private readonly disconnectTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Map of battle ID -> lock promise for serializing state-changing operations.
   * Prevents race conditions when multiple operations (processChoice, forfeit,
   * handleTurnTimeout) occur simultaneously on the same battle.
   * This works because battles are hosted on a single server.
   * TODO: If multi-server battle hosting is needed, replace with Redis Lua script.
   */
  private readonly battleLocks = new Map<string, Promise<void>>();

  constructor(
    private readonly logger: AppLogger,
    @Inject(REDIS_SERVICE) private readonly redis: RedisService,
    @Inject(TURN_TIMER_SERVICE) private readonly turnTimer: ITurnTimerService
  ) {
    this.logger.setContext(BattleManagerService.name);
    this.setupTurnTimerCallbacks();
  }

  private setupTurnTimerCallbacks(): void {
    this.turnTimer.setCallbacks(
      // Warning callback — skip if player already submitted
      async (battleId, player, secondsRemaining) => {
        const pending = await this.redis.getPendingChoices(battleId);
        if (pending[player]) return;

        const instance = this.battles.get(battleId);
        if (!instance) return;

        const targetUserId =
          player === 'p1'
            ? instance.config.player1.id
            : instance.config.player2.id;

        await this.redis.publishBattleUpdate(battleId, {
          type: 'event',
          targetUserId,
          data: { event: 'turn_warning', player, secondsRemaining },
        });
      },
      // Timeout callback - auto-select random move
      async (battleId, player, playerId) => {
        await this.handleTurnTimeout(battleId, player, playerId);
      }
    );
  }

  /**
   * Create and start a new battle
   */
  async createBattle(config: BattleConfig): Promise<ActiveBattle> {
    this.logger.log(
      `Creating battle ${config.id}: ${config.player1.name} vs ${config.player2.name} (${config.format})`
    );

    // Create the battle instance
    const instance = await this.createBattleInstance(config);
    this.battles.set(config.id, instance);

    // Store metadata in Redis
    await this.redis.createBattle(config.id, {
      config: JSON.stringify(config),
      status: 'active',
      hostServer: this.redis.getServerId(),
      pending: '{}',
      p1Disconnected: 'false',
      p2Disconnected: 'false',
    });

    // Store the seed for deterministic replay
    await this.redis.setBattleSeed(config.id, config.seed);

    // Track battle on this server
    await this.redis.addServerBattle(config.id);

    // Track both players' current battle
    await Promise.all([
      this.redis.setUserBattle(config.player1.id, config.id),
      this.redis.setUserBattle(config.player2.id, config.id),
    ]);

    // Set safety-net TTL on all battle keys. Normal battle completion
    // will shorten this to 1 hour (replay window). This only matters
    // if the server crashes and no player ever reconnects.
    await Promise.all([
      this.redis.setBattleMetadataTTL(config.id, BATTLE_KEY_TTL_SECONDS),
      this.redis.setBattleSeedTTL(config.id, BATTLE_KEY_TTL_SECONDS),
      this.redis.setBattleLogTTL(config.id, BATTLE_KEY_TTL_SECONDS),
    ]);

    this.logger.log(`Battle ${config.id} created and ready`);

    // Start turn timers for both players
    this.turnTimer.startTimers(
      config.id,
      config.player1.id,
      config.player2.id,
      false, // p1 hasn't chosen
      false // p2 hasn't chosen
    );

    // The initial state IS the first delta — read full state and advance
    // cursors so subsequent reads only return new data.
    const p1Initial = instance.p1State;
    const p2Initial = instance.p2State;
    instance.advanceCursors();

    return {
      id: config.id,
      config,
      currentState: instance.currentState,
      p1State: p1Initial,
      p2State: p2Initial,
    };
  }

  /**
   * Process a player's choice (move or switch)
   */
  async processChoice(
    battleId: string,
    playerId: string,
    choice: string
  ): Promise<void> {
    return this.withBattleLock(battleId, async () => {
      await this.processChoiceInternal(battleId, playerId, choice);
    });
  }

  /**
   * Internal implementation of processChoice (must be called while holding the battle lock)
   */
  private async processChoiceInternal(
    battleId: string,
    playerId: string,
    choice: string
  ): Promise<void> {
    const instance = this.battles.get(battleId);
    if (!instance) {
      throw new Error(`Battle ${battleId} not found on this server`);
    }

    if (instance.ended) {
      this.logger.warn(
        `Battle ${battleId}: choice rejected — battle has ended`
      );
      return;
    }

    const player = this.getPlayerSlot(instance.config, playerId);
    if (!player) {
      throw new Error(`Player ${playerId} is not in battle ${battleId}`);
    }

    if (!instance.awaitingChoices) {
      this.logger.warn(
        `Battle ${battleId}: ${player} choice rejected — turn is being processed`
      );
      return;
    }

    const pending = await this.redis.getPendingChoices(battleId);
    const opponent = player === 'p1' ? 'p2' : 'p1';

    if (pending[player] && pending[opponent]) {
      this.logger.warn(
        `Battle ${battleId}: ${player} choice rejected — turn already locked`
      );
      return;
    }

    if (pending[player]) {
      this.logger.debug(
        `Battle ${battleId}: ${player} changed choice from "${pending[player]}" to "${choice}"`
      );
    } else {
      this.logger.debug(`Battle ${battleId}: ${player} chose "${choice}"`);
    }

    // Don't cancel the player's turn timer here — let it keep ticking.
    // If the player cancels their choice, the original timer is still running.
    // The timer is cleared when the turn executes (both players ready)
    // or when the timeout fires (handleTurnTimeout checks for pending choice).

    // Store the choice (overwrites previous if opponent hasn't chosen yet).
    // The replay log is appended only when the turn actually executes
    // (see executeTurn), so overridden choices never reach the log.
    pending[player] = choice;
    await this.redis.setPendingChoices(battleId, pending);

    // Check if we have all needed choices to execute
    // The sim's requestState tells us who needs to act:
    // '' = no request (waiting), 'move'/'switch'/'teampreview' = needs a choice
    const simBattle = instance.stream.battle;
    if (!simBattle) {
      this.logger.error(`Battle ${battleId}: no sim battle instance`);
      return;
    }
    const p1NeedsChoice = !!simBattle.p1.requestState;
    const p2NeedsChoice = !!simBattle.p2.requestState;

    const p1Ready = pending.p1 || !p1NeedsChoice;
    const p2Ready = pending.p2 || !p2NeedsChoice;

    if (p1Ready && p2Ready) {
      await this.executeTurn(
        battleId,
        instance,
        pending.p1 || 'pass',
        pending.p2 || 'pass'
      );
    }
  }

  /**
   * Cancel a player's pending choice (undo before the turn executes).
   * Only succeeds if the opponent hasn't also submitted yet.
   */
  async cancelChoice(battleId: string, playerId: string): Promise<void> {
    return this.withBattleLock(battleId, async () => {
      const instance = this.battles.get(battleId);
      if (!instance) {
        throw new Error(`Battle ${battleId} not found on this server`);
      }

      const player = this.getPlayerSlot(instance.config, playerId);
      if (!player) {
        throw new Error(`Player ${playerId} is not in battle ${battleId}`);
      }

      if (!instance.awaitingChoices) {
        this.logger.warn(
          `Battle ${battleId}: ${player} cancel rejected — turn is being processed`
        );
        return;
      }

      const pending = await this.redis.getPendingChoices(battleId);
      const opponent = player === 'p1' ? 'p2' : 'p1';

      if (!pending[player]) {
        this.logger.debug(
          `Battle ${battleId}: ${player} cancel — no pending choice`
        );
        return;
      }

      if (pending[opponent]) {
        this.logger.warn(
          `Battle ${battleId}: ${player} cancel rejected — both players have chosen`
        );
        return;
      }

      this.logger.debug(
        `Battle ${battleId}: ${player} cancelled choice "${pending[player]}"`
      );

      delete pending[player];
      await this.redis.setPendingChoices(battleId, pending);

      // Don't restart the timer — the original turn timer keeps ticking.
      // This prevents abuse (cancel + resubmit to get infinite time).
    });
  }

  /**
   * Forfeit a battle
   */
  async forfeit(battleId: string, playerId: string): Promise<void> {
    return this.withBattleLock(battleId, async () => {
      const instance = this.battles.get(battleId);
      if (!instance) {
        throw new Error(`Battle ${battleId} not found on this server`);
      }

      const player = this.getPlayerSlot(instance.config, playerId);
      if (!player) {
        throw new Error(`Player ${playerId} is not in battle ${battleId}`);
      }

      this.logger.log(`Battle ${battleId}: ${player} forfeited`);

      // Log the forfeit
      await this.redis.appendBattleLog(battleId, `>${player} forfeit`);

      // End the battle with the other player as winner
      const winnerId =
        player === 'p1'
          ? instance.config.player2.id
          : instance.config.player1.id;

      await this.endBattle(battleId, winnerId, 'forfeited');
    });
  }

  /**
   * Recover a battle from Redis (after server crash)
   */
  async recoverBattle(battleId: string): Promise<ActiveBattle> {
    this.logger.log(`Recovering battle ${battleId}`);

    const metadata = await this.redis.getBattleMetadata(battleId);
    if (!metadata) {
      throw new Error(`Battle ${battleId} not found in Redis`);
    }

    const config: BattleConfig = JSON.parse(metadata.config);
    const seed = await this.redis.getBattleSeed(battleId);
    const log = await this.redis.getBattleLog(battleId);

    if (!seed) {
      throw new Error(`Seed not found for battle ${battleId}`);
    }

    // Recreate battle with the same seed
    const instance = await this.createBattleInstance({ ...config, seed });

    // Replay all logged commands
    for (const command of log) {
      if (command.startsWith('>p1 ')) {
        await this.writeToStream(instance, `>p1 ${command.slice(4)}`);
      } else if (command.startsWith('>p2 ')) {
        await this.writeToStream(instance, `>p2 ${command.slice(4)}`);
      }
    }

    this.battles.set(battleId, instance);

    // Update host server in Redis
    await this.redis.updateBattleMetadata(battleId, {
      hostServer: this.redis.getServerId(),
    });

    // Track battle on this server
    await this.redis.addServerBattle(battleId);

    // Restart turn timers — they live in process memory, so the previous host's
    // timers died with it. Without this, recovered battles have no turn clock
    // and both players could stall the game indefinitely.
    // Treat a player as "already chosen" if they have a pending choice in Redis
    // (submitted before the crash) or the sim no longer needs their input.
    const pending = await this.redis.getPendingChoices(battleId);
    const simBattle = instance.stream.battle;
    const p1NeedsChoice = !!simBattle?.p1.requestState;
    const p2NeedsChoice = !!simBattle?.p2.requestState;
    this.turnTimer.startTimers(
      battleId,
      config.player1.id,
      config.player2.id,
      !!pending.p1 || !p1NeedsChoice,
      !!pending.p2 || !p2NeedsChoice
    );

    this.logger.log(`Battle ${battleId} recovered successfully`);

    // Read full state for the rejoin response, and advance cursors
    // so subsequent executeTurn calls only send deltas.
    const p1Full = instance.p1State;
    const p2Full = instance.p2State;
    instance.advanceCursors();

    return {
      id: battleId,
      config,
      currentState: instance.currentState,
      p1State: p1Full,
      p2State: p2Full,
    };
  }

  /**
   * Get an active battle by ID (from local memory)
   */
  getBattle(battleId: string): ActiveBattle | undefined {
    const instance = this.battles.get(battleId);
    if (!instance) {
      return undefined;
    }

    return {
      id: battleId,
      config: instance.config,
      currentState: instance.currentState,
      p1State: instance.p1State,
      p2State: instance.p2State,
    };
  }

  /**
   * Check if a battle is hosted on this server
   */
  isHostedLocally(battleId: string): boolean {
    return this.battles.has(battleId);
  }

  /**
   * Handle player disconnect
   */
  async handleDisconnect(battleId: string, playerId: string): Promise<void> {
    const instance = this.battles.get(battleId);
    if (!instance) {
      return; // Battle not on this server
    }

    const player = this.getPlayerSlot(instance.config, playerId);
    if (!player) {
      return;
    }

    // Idempotency: if a disconnect timeout is already armed for this
    // (battleId, playerId), the player has been marked disconnected and
    // OPPONENT_DISCONNECTED already published. A duplicate call here
    // (e.g. socket.io churn under CI load triggering handleDisconnect for
    // the same user repeatedly) would otherwise re-publish, amplify the
    // bridge subscriber's queue, and starve other battles' events.
    // handleReconnect clears the timeout, so a genuine reconnect →
    // disconnect cycle still goes through.
    const timeoutKey = `${battleId}:${playerId}`;
    if (this.disconnectTimeouts.has(timeoutKey)) {
      return;
    }

    this.logger.log(`Battle ${battleId}: ${player} disconnected`);

    const now = Date.now().toString();
    const updates =
      player === 'p1'
        ? { p1Disconnected: 'true', p1DisconnectTime: now }
        : { p2Disconnected: 'true', p2DisconnectTime: now };

    await this.redis.updateBattleMetadata(battleId, updates);

    // Notify opponent via pub/sub
    const opponentId =
      player === 'p1' ? instance.config.player2.id : instance.config.player1.id;

    await this.redis.publishBattleUpdate(battleId, {
      type: 'event',
      targetUserId: opponentId,
      data: { event: 'opponent_disconnected', player },
    });

    // Start disconnect timeout
    this.scheduleDisconnectTimeout(battleId, playerId);
  }

  /**
   * Handle player reconnect
   */
  async handleReconnect(
    battleId: string,
    playerId: string
  ): Promise<ActiveBattle> {
    // Try local first
    const instance = this.battles.get(battleId);

    if (!instance) {
      // Battle might be on another server or needs recovery
      const metadata = await this.redis.getBattleMetadata(battleId);
      if (!metadata) {
        throw new Error(`Battle ${battleId} not found`);
      }

      // Don't recover battles that have already ended
      if (metadata.status !== 'active') {
        throw new Error(`Battle ${battleId} has already ended`);
      }

      // Check if original host is still alive
      const hostAlive = await this.redis.isServerAlive(metadata.hostServer);
      if (!hostAlive || metadata.hostServer === this.redis.getServerId()) {
        // Recover the battle on this server
        return this.recoverBattle(battleId);
      }

      // Battle is still on another server - shouldn't reach here normally
      throw new Error(`Battle ${battleId} is on server ${metadata.hostServer}`);
    }

    const player = this.getPlayerSlot(instance.config, playerId);
    if (!player) {
      throw new Error(`Player ${playerId} is not in battle ${battleId}`);
    }

    this.logger.log(`Battle ${battleId}: ${player} reconnected`);

    // Clear disconnect timeout (only effective if reconnecting to same server)
    this.clearDisconnectTimeout(`${battleId}:${playerId}`);

    // Clear disconnect flag
    const updates =
      player === 'p1'
        ? { p1Disconnected: 'false' }
        : { p2Disconnected: 'false' };

    await this.redis.updateBattleMetadata(battleId, updates);

    // Notify opponent
    const opponentId =
      player === 'p1' ? instance.config.player2.id : instance.config.player1.id;

    await this.redis.publishBattleUpdate(battleId, {
      type: 'event',
      targetUserId: opponentId,
      data: { event: 'opponent_reconnected', player },
    });

    // Advance cursors so subsequent executeTurn calls only send deltas
    instance.advanceCursors();

    return {
      id: battleId,
      config: instance.config,
      currentState: instance.currentState,
      p1State: instance.p1State,
      p2State: instance.p2State,
    };
  }

  // ==================== Private Helpers ====================

  /**
   * Execute a function while holding a lock for the specified battle.
   * Ensures only one state-changing operation runs at a time per battle.
   */
  private async withBattleLock<T>(
    battleId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Wait for any pending operation on this battle
    while (this.battleLocks.has(battleId)) {
      await this.battleLocks.get(battleId);
    }

    // Create a lock
    let unlock!: () => void;
    const lock = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    this.battleLocks.set(battleId, lock);

    try {
      return await fn();
    } finally {
      this.battleLocks.delete(battleId);
      unlock();
    }
  }

  private async createBattleInstance(
    config: BattleConfig
  ): Promise<BattleInstance> {
    // Create the battle stream
    const stream = new BattleStreams.BattleStream();
    const streams = BattleStreams.getPlayerStreams(stream);

    // Buffer to collect omniscient output (for replay log)
    let currentState = '';
    void (async () => {
      for await (const chunk of streams.omniscient) {
        currentState += chunk + '\n';
      }
    })();

    // Buffer per-player perspective streams (opponent info redacted).
    // Track cursor positions so we can return deltas for BATTLE_UPDATE
    // while still having the full state available for BATTLE_START / rejoin.
    let p1State = '';
    let p1Cursor = 0;
    void (async () => {
      for await (const chunk of streams.p1) {
        this.logger.debug(`Battle ${config.id} p1 stream: ${chunk}`);
        p1State += chunk + '\n';
      }
    })();

    let p2State = '';
    let p2Cursor = 0;
    void (async () => {
      for await (const chunk of streams.p2) {
        this.logger.debug(`Battle ${config.id} p2 stream: ${chunk}`);
        p2State += chunk + '\n';
      }
    })();

    // Initialize the battle with start command
    // Note: seed must be passed as a string (PRNGSeed format)
    const spec = { formatid: config.format, seed: config.seed };

    // Player specs include the packed team for battle creation
    const p1spec = {
      name: config.player1.name,
      team: config.player1.packedTeam,
    };
    const p2spec = {
      name: config.player2.name,
      team: config.player2.packedTeam,
    };

    await streams.omniscient.write(
      `>start ${JSON.stringify(spec)}\n` +
        `>player p1 ${JSON.stringify(p1spec)}\n` +
        `>player p2 ${JSON.stringify(p2spec)}`
    );

    // Yield to the event loop so the async iterators reading from
    // streams.p1, streams.p2, and streams.omniscient can drain the
    // output buffers produced by the write above.
    await new Promise((resolve) => setImmediate(resolve));

    return {
      config,
      stream,
      streams,
      get currentState() {
        return currentState;
      },
      get p1State() {
        return p1State;
      },
      get p2State() {
        return p2State;
      },
      get p1Delta() {
        const delta = p1State.slice(p1Cursor);
        p1Cursor = p1State.length;
        return delta;
      },
      get p2Delta() {
        const delta = p2State.slice(p2Cursor);
        p2Cursor = p2State.length;
        return delta;
      },
      advanceCursors() {
        p1Cursor = p1State.length;
        p2Cursor = p2State.length;
      },
      ended: false,
      winnerId: null,
      awaitingChoices: true,
    };
  }

  private async writeToStream(
    instance: BattleInstance,
    command: string
  ): Promise<void> {
    await instance.streams.omniscient.write(command);
    // Yield to the event loop so the async iterators reading from
    // streams.p1, streams.p2, and streams.omniscient can drain the
    // output buffers produced by the write above.
    await new Promise((resolve) => setImmediate(resolve));
  }

  private getPlayerSlot(
    config: BattleConfig,
    playerId: string
  ): 'p1' | 'p2' | null {
    if (config.player1.id === playerId) return 'p1';
    if (config.player2.id === playerId) return 'p2';
    return null;
  }

  private async executeTurn(
    battleId: string,
    instance: BattleInstance,
    p1Choice: string,
    p2Choice: string
  ): Promise<void> {
    instance.awaitingChoices = false;

    this.logger.debug(
      `Battle ${battleId}: executing turn (p1: ${p1Choice}, p2: ${p2Choice})`
    );

    // Send choices to the battle stream (only for players who have an active request)
    // and append the executed choice to the replay log. Logging here — not in
    // processChoiceInternal — guarantees the log only contains choices that
    // were actually executed, so recoverBattle's replay matches reality even
    // when a player changed their choice before the turn locked.
    if (p1Choice !== 'pass') {
      await this.redis.appendBattleLog(battleId, `>p1 ${p1Choice}`);
      await this.writeToStream(instance, `>p1 ${p1Choice}`);
    }
    if (p2Choice !== 'pass') {
      await this.redis.appendBattleLog(battleId, `>p2 ${p2Choice}`);
      await this.writeToStream(instance, `>p2 ${p2Choice}`);
    }

    // Clear pending choices
    await this.redis.setPendingChoices(battleId, {});

    // Publish only the new per-player data since the last send
    await this.redis.publishBattleUpdate(battleId, {
      type: 'state',
      p1Id: instance.config.player1.id,
      p2Id: instance.config.player2.id,
      p1Data: instance.p1Delta,
      p2Data: instance.p2Delta,
    });

    // Use the sim's Battle object for win/tie detection
    const simBattle = instance.stream.battle;
    if (!simBattle) {
      return;
    }
    if (simBattle.ended) {
      if (simBattle.winner) {
        const winnerId =
          simBattle.winner === instance.config.player1.name
            ? instance.config.player1.id
            : instance.config.player2.id;
        instance.ended = true;
        instance.winnerId = winnerId;
        await this.endBattle(battleId, winnerId, 'completed');
      } else {
        instance.ended = true;
        instance.winnerId = null;
        await this.endBattle(battleId, null, 'completed');
      }
    } else {
      // Battle continues - accept new choices and start turn timers
      instance.awaitingChoices = true;

      // Only start timers for players who actually need to make a choice.
      // After a faint, only the player with the KO'd Pokemon needs to switch;
      // the other player has no request and shouldn't get a timer.
      const p1NeedsChoice = !!simBattle.p1.requestState;
      const p2NeedsChoice = !!simBattle.p2.requestState;

      this.turnTimer.startTimers(
        battleId,
        instance.config.player1.id,
        instance.config.player2.id,
        !p1NeedsChoice, // treat as "already chosen" if no request
        !p2NeedsChoice // treat as "already chosen" if no request
      );
    }
  }

  private async endBattle(
    battleId: string,
    winnerId: string | null,
    status: 'completed' | 'forfeited'
  ): Promise<void> {
    this.logger.log(`Battle ${battleId} ended. Winner: ${winnerId ?? 'draw'}`);

    // Cancel all turn timers
    this.turnTimer.cancelBattleTimers(battleId);

    // Clear any pending disconnect timeouts
    this.clearBattleDisconnectTimeouts(battleId);

    const instance = this.battles.get(battleId);
    if (!instance) return;

    // Update Redis status and winner
    await this.redis.updateBattleMetadata(battleId, {
      status,
      winnerId: winnerId ?? '',
    });

    // Determine the end reason
    let reason: 'win' | 'forfeit' | 'draw';
    if (status === 'forfeited') {
      reason = 'forfeit';
    } else if (winnerId === null) {
      reason = 'draw';
    } else {
      reason = 'win';
    }

    // Publish end event
    await this.redis.publishBattleUpdate(battleId, {
      type: 'end',
      data: { winnerId, reason },
    });

    // Clear user battle states
    await Promise.all([
      this.redis.clearUserBattle(instance.config.player1.id),
      this.redis.clearUserBattle(instance.config.player2.id),
    ]);

    // Set TTL on all battle keys — keeps data for 1 hour (replay save window)
    // then Redis auto-deletes everything. Also drop the battle from this
    // server's tracking set: set members don't honor key TTLs, so without
    // this call the set accumulates dead battle IDs indefinitely.
    await Promise.all([
      this.redis.setBattleLogTTL(battleId, 3600),
      this.redis.setBattleMetadataTTL(battleId, 3600),
      this.redis.setBattleSeedTTL(battleId, 3600),
      this.redis.removeServerBattle(battleId),
    ]);

    // Remove from local map
    this.battles.delete(battleId);
  }

  /**
   * Handle turn timeout - use Pokemon Showdown's built-in autoChoose
   */
  private async handleTurnTimeout(
    battleId: string,
    player: 'p1' | 'p2',
    playerId: string
  ): Promise<void> {
    return this.withBattleLock(battleId, async () => {
      const instance = this.battles.get(battleId);
      if (!instance || instance.ended) return;

      // Skip auto-move if player already submitted a choice
      // (timer kept running after submission to support cancel/undo)
      const pending = await this.redis.getPendingChoices(battleId);
      if (pending[player]) {
        this.logger.debug(
          `Battle ${battleId}: ${player} timeout skipped — already has pending choice`
        );
        return;
      }

      // battle is typed as Battle | null in @pkmn/sim
      const battle = instance.stream.battle;
      if (!battle) {
        this.logger.error(
          `Battle ${battleId}: no battle instance for auto-move`
        );
        return;
      }

      // sides is a tuple [Side, Side] (or [Side, Side, Side, Side] for multi-battles)
      // so indices 0 and 1 are always valid Side objects for standard battles
      const sideIndex = player === 'p1' ? 0 : 1;
      const side = battle.sides[sideIndex];

      try {
        // Use Pokemon Showdown's built-in auto-choice logic
        side.autoChoose();
        const choice = side.getChoice();

        this.logger.log(
          `Battle ${battleId}: ${player} auto-move selected: "${choice}"`
        );

        // Process the choice internally (already holding lock, so call inner logic)
        await this.processChoiceInternal(battleId, playerId, choice);
      } catch (error) {
        this.logger.error(`Battle ${battleId}: auto-move failed: ${error}`);
      }
    });
  }

  /**
   * Schedule a timeout to forfeit if player doesn't reconnect.
   *
   * Note: The timeout is only cleared if the player reconnects to the SAME server.
   * If they reconnect to a different server, the timeout will still fire but the
   * Redis check (p1Disconnected/p2Disconnected flag) prevents incorrect forfeits.
   */
  private scheduleDisconnectTimeout(battleId: string, playerId: string): void {
    const timeoutKey = `${battleId}:${playerId}`;

    // Clear any existing timeout for this player (e.g., rapid disconnect/reconnect)
    this.clearDisconnectTimeout(timeoutKey);

    const timeout = setTimeout(async () => {
      // Clean up the timeout reference
      this.disconnectTimeouts.delete(timeoutKey);

      const metadata = await this.redis.getBattleMetadata(battleId);
      if (!metadata || metadata.status !== 'active') {
        return; // Battle already ended
      }

      const instance = this.battles.get(battleId);
      if (!instance) return;

      const player = this.getPlayerSlot(instance.config, playerId);
      if (!player) return;

      // Check if still disconnected (handles cross-server reconnect case)
      const isDisconnected =
        player === 'p1'
          ? metadata.p1Disconnected === 'true'
          : metadata.p2Disconnected === 'true';

      if (isDisconnected) {
        this.logger.log(`Battle ${battleId}: ${player} timed out, forfeiting`);
        await this.forfeit(battleId, playerId);
      }
    }, DISCONNECT_TIMEOUT_MS);

    this.disconnectTimeouts.set(timeoutKey, timeout);
  }

  /**
   * Clear a disconnect timeout by key
   */
  private clearDisconnectTimeout(timeoutKey: string): void {
    const timeout = this.disconnectTimeouts.get(timeoutKey);
    if (timeout) {
      clearTimeout(timeout);
      this.disconnectTimeouts.delete(timeoutKey);
    }
  }

  /**
   * Clear all disconnect timeouts for a battle
   */
  private clearBattleDisconnectTimeouts(battleId: string): void {
    const prefix = `${battleId}:`;
    for (const [key, timeout] of this.disconnectTimeouts.entries()) {
      if (key.startsWith(prefix)) {
        clearTimeout(timeout);
        this.disconnectTimeouts.delete(key);
      }
    }
  }

  /**
   * Cancel a battle before it really starts (e.g., opponent declined match).
   * Cleans up all battle state without declaring a winner.
   */
  async cancelBattle(battleId: string): Promise<void> {
    this.logger.log(`Cancelling battle ${battleId}`);

    // Cancel timers
    this.turnTimer.cancelBattleTimers(battleId);
    this.clearBattleDisconnectTimeouts(battleId);

    const instance = this.battles.get(battleId);
    if (instance) {
      // Clear user battle states
      await Promise.all([
        this.redis.clearUserBattle(instance.config.player1.id),
        this.redis.clearUserBattle(instance.config.player2.id),
      ]);

      // Remove from local map
      this.battles.delete(battleId);
    }

    // Clean up all Redis state for this battle
    await this.redis.cleanupBattle(battleId);
  }
}

/**
 * Internal battle instance state
 */
interface BattleInstance {
  config: BattleConfig;
  stream: BattleStreams.BattleStream;
  streams: ReturnType<typeof BattleStreams.getPlayerStreams>;
  /** Omniscient state — full accumulated output (for replay log) */
  currentState: string;
  /** Player 1 perspective — full accumulated output (for BATTLE_START / rejoin) */
  p1State: string;
  /** Player 2 perspective — full accumulated output (for BATTLE_START / rejoin) */
  p2State: string;
  /** Player 1 delta — new data since last call (for BATTLE_UPDATE). Advances cursor on read. */
  p1Delta: string;
  /** Player 2 delta — new data since last call (for BATTLE_UPDATE). Advances cursor on read. */
  p2Delta: string;
  /** Advance both cursors to current position without reading. Use after sending full state. */
  advanceCursors(): void;
  ended: boolean;
  winnerId: string | null;
  /** Whether the sim is waiting for player choices. False while a turn is being processed. */
  awaitingChoices: boolean;
}

export const BattleManagerServiceProvider: Provider = {
  provide: BATTLE_MANAGER_SERVICE,
  useClass: BattleManagerService,
};
