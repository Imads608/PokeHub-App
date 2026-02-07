import {
  BATTLE_MANAGER_SERVICE,
  type ActiveBattle,
  type IBattleManagerService,
} from './battle-manager.service.interface';
import {
  TURN_TIMER_SERVICE,
  type ITurnTimerService,
} from '../turn-timer/turn-timer.service.interface';
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
      // Warning callback
      async (battleId, player, secondsRemaining) => {
        await this.redis.publishBattleUpdate(battleId, {
          type: 'event',
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

    this.logger.log(`Battle ${config.id} created and ready`);

    // Start turn timers for both players
    this.turnTimer.startTimers(
      config.id,
      config.player1.id,
      config.player2.id,
      false, // p1 hasn't chosen
      false // p2 hasn't chosen
    );

    return {
      id: config.id,
      config,
      currentState: instance.currentState,
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
    const instance = this.battles.get(battleId);
    if (!instance) {
      throw new Error(`Battle ${battleId} not found on this server`);
    }

    const player = this.getPlayerSlot(instance.config, playerId);
    if (!player) {
      throw new Error(`Player ${playerId} is not in battle ${battleId}`);
    }

    this.logger.debug(`Battle ${battleId}: ${player} chose "${choice}"`);

    // Cancel the player's turn timer
    this.turnTimer.cancelPlayerTimer(battleId, player);

    // Store the choice
    const pending = await this.redis.getPendingChoices(battleId);
    pending[player] = choice;
    await this.redis.setPendingChoices(battleId, pending);

    // Log the command for replay
    await this.redis.appendBattleLog(battleId, `>${player} ${choice}`);

    // Check if both players have chosen
    if (pending.p1 && pending.p2) {
      await this.executeTurn(battleId, instance, pending.p1, pending.p2);
    }
  }

  /**
   * Forfeit a battle
   */
  async forfeit(battleId: string, playerId: string): Promise<void> {
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
      player === 'p1' ? instance.config.player2.id : instance.config.player1.id;

    await this.endBattle(battleId, winnerId, 'forfeited');
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

    this.logger.log(`Battle ${battleId} recovered successfully`);

    return {
      id: battleId,
      config,
      currentState: instance.currentState,
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

    this.logger.log(`Battle ${battleId}: ${player} disconnected`);

    const now = Date.now().toString();
    const updates =
      player === 'p1'
        ? { p1Disconnected: 'true', p1DisconnectTime: now }
        : { p2Disconnected: 'true', p2DisconnectTime: now };

    await this.redis.updateBattleMetadata(battleId, updates);

    // Notify opponent via pub/sub
    await this.redis.publishBattleUpdate(battleId, {
      type: 'event',
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

    // Clear disconnect flag
    const updates =
      player === 'p1'
        ? { p1Disconnected: 'false' }
        : { p2Disconnected: 'false' };

    await this.redis.updateBattleMetadata(battleId, updates);

    // Notify opponent
    await this.redis.publishBattleUpdate(battleId, {
      type: 'event',
      data: { event: 'opponent_reconnected', player },
    });

    return {
      id: battleId,
      config: instance.config,
      currentState: instance.currentState,
    };
  }

  // ==================== Private Helpers ====================

  private async createBattleInstance(
    config: BattleConfig
  ): Promise<BattleInstance> {
    // Create the battle stream
    const stream = new BattleStreams.BattleStream();
    const streams = BattleStreams.getPlayerStreams(stream);

    // Buffer to collect battle output
    let currentState = '';

    // Start reading from omniscient stream
    void (async () => {
      for await (const chunk of streams.omniscient) {
        currentState += chunk + '\n';
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

    return {
      config,
      stream,
      streams,
      get currentState() {
        return currentState;
      },
      ended: false,
      winnerId: null,
    };
  }

  private async writeToStream(
    instance: BattleInstance,
    command: string
  ): Promise<void> {
    await instance.streams.omniscient.write(command);
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
    this.logger.debug(
      `Battle ${battleId}: executing turn (p1: ${p1Choice}, p2: ${p2Choice})`
    );

    // Send choices to the battle stream
    await this.writeToStream(instance, `>p1 ${p1Choice}`);
    await this.writeToStream(instance, `>p2 ${p2Choice}`);

    // Clear pending choices
    await this.redis.setPendingChoices(battleId, {});

    // Get the new state
    const newState = instance.currentState;

    // Publish update to both players
    await this.redis.publishBattleUpdate(battleId, {
      type: 'state',
      data: newState,
    });

    // Check if battle ended (look for |win| or |tie| in the output)
    const winMatch = newState.match(/\|win\|(.+)/);
    const tieMatch = newState.match(/\|tie/);

    if (winMatch) {
      const winnerName = winMatch[1];
      const winnerId =
        winnerName === instance.config.player1.name
          ? instance.config.player1.id
          : instance.config.player2.id;
      instance.ended = true;
      instance.winnerId = winnerId;
      await this.endBattle(battleId, winnerId, 'completed');
    } else if (tieMatch) {
      instance.ended = true;
      instance.winnerId = null;
      await this.endBattle(battleId, null, 'completed');
    } else {
      // Battle continues - start new turn timers
      this.turnTimer.startTimers(
        battleId,
        instance.config.player1.id,
        instance.config.player2.id,
        false,
        false
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

    const instance = this.battles.get(battleId);
    if (!instance) return;

    // Update Redis status
    await this.redis.updateBattleMetadata(battleId, { status });

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

    // Set TTL on battle log for replay saving (1 hour)
    await this.redis.setBattleLogTTL(battleId, 3600);

    // Remove from local map
    this.battles.delete(battleId);
  }

  /**
   * Handle turn timeout - auto-select a random valid move
   */
  /**
   * Handle turn timeout - use Pokemon Showdown's built-in autoChoose
   */
  private async handleTurnTimeout(
    battleId: string,
    player: 'p1' | 'p2',
    playerId: string
  ): Promise<void> {
    const instance = this.battles.get(battleId);
    if (!instance || instance.ended) return;

    const battle = instance.stream.battle;
    if (!battle) {
      this.logger.error(`Battle ${battleId}: no battle instance for auto-move`);
      return;
    }

    const sideIndex = player === 'p1' ? 0 : 1;
    const side = battle.sides[sideIndex];

    try {
      // Use Pokemon Showdown's built-in auto-choice logic
      side.autoChoose();
      const choice = side.getChoice();

      this.logger.log(
        `Battle ${battleId}: ${player} auto-move selected: "${choice}"`
      );

      // Process the choice
      await this.processChoice(battleId, playerId, choice);
    } catch (error) {
      this.logger.error(`Battle ${battleId}: auto-move failed: ${error}`);
    }
  }

  private scheduleDisconnectTimeout(battleId: string, playerId: string): void {
    setTimeout(async () => {
      const metadata = await this.redis.getBattleMetadata(battleId);
      if (!metadata || metadata.status !== 'active') {
        return; // Battle already ended
      }

      const instance = this.battles.get(battleId);
      if (!instance) return;

      const player = this.getPlayerSlot(instance.config, playerId);
      if (!player) return;

      // Check if still disconnected
      const isDisconnected =
        player === 'p1'
          ? metadata.p1Disconnected === 'true'
          : metadata.p2Disconnected === 'true';

      if (isDisconnected) {
        this.logger.log(`Battle ${battleId}: ${player} timed out, forfeiting`);
        await this.forfeit(battleId, playerId);
      }
    }, DISCONNECT_TIMEOUT_MS);
  }
}

/**
 * Internal battle instance state
 */
interface BattleInstance {
  config: BattleConfig;
  stream: BattleStreams.BattleStream;
  streams: ReturnType<typeof BattleStreams.getPlayerStreams>;
  currentState: string;
  ended: boolean;
  winnerId: string | null;
}

export const BattleManagerServiceProvider: Provider = {
  provide: BATTLE_MANAGER_SERVICE,
  useClass: BattleManagerService,
};
