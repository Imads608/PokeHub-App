import { WsJwtGuard, type AuthenticatedSocket } from './guards/ws-jwt.guard';
import { WsThrottlerGuard, WsThrottle } from './guards/ws-throttler.guard';
import {
  BATTLE_MANAGER_SERVICE,
  type IBattleManagerService,
} from './services/battle-manager/battle-manager.service.interface';
import {
  BATTLE_PERSISTENCE_SERVICE,
  type IBattlePersistenceService,
} from './services/battle-persistence/battle-persistence.service.interface';
import {
  MATCHMAKING_SERVICE,
  type IMatchmakingService,
} from './services/matchmaking/matchmaking.service.interface';
import {
  BATTLE_SOCKET_BRIDGE_SERVICE,
  type IBattleSocketBridgeService,
} from './services/battle-socket-bridge/battle-socket-bridge.service.interface';
import {
  MATCH_ORCHESTRATOR_SERVICE,
  type IMatchOrchestratorService,
} from './services/match-orchestrator/match-orchestrator.service.interface';
import { Inject, OnModuleDestroy, UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import {
  REDIS_SERVICE,
  type RedisService,
} from '@pokehub/backend/pokehub-redis';
import {
  TEAMS_DB_SERVICE,
  type ITeamsDBService,
} from '@pokehub/backend/pokehub-teams-db';
import { AppLogger } from '@pokehub/backend/shared-logger';
import {
  type BattleConfig,
  type ServerBattleEvent,
  JoinQueueDTOSchema,
  BattleMoveDTOSchema,
  CancelChoiceDTOSchema,
  ForfeitDTOSchema,
  RejoinDTOSchema,
  SaveReplayDTOSchema,
  DeclineMatchDTOSchema,
  BATTLE_NAMESPACE,
  BattleRooms,
  BATTLE_EVENT,
} from '@pokehub/shared/pokemon-battle-types';
import { packTeam, isRandomFormat, generateRandomTeam } from '@pokehub/shared/pokemon-showdown-validation';
import {
  extractMoveNames,
  getMoveAnimConfigs,
} from '@pokehub/backend/pokehub-move-anim-catalog';
import { Server } from 'socket.io';

@WebSocketGateway({
  namespace: BATTLE_NAMESPACE,
  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:4200',
    credentials: true,
  },
})
export class BattleGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  @WebSocketServer() server!: Server;

  constructor(
    private readonly logger: AppLogger,
    private readonly wsJwtGuard: WsJwtGuard,
    @Inject(REDIS_SERVICE) private readonly redis: RedisService,
    @Inject(MATCHMAKING_SERVICE)
    private readonly matchmaking: IMatchmakingService,
    @Inject(BATTLE_MANAGER_SERVICE)
    private readonly battleManager: IBattleManagerService,
    @Inject(BATTLE_PERSISTENCE_SERVICE)
    private readonly persistence: IBattlePersistenceService,
    @Inject(TEAMS_DB_SERVICE) private readonly teamsDb: ITeamsDBService,
    @Inject(BATTLE_SOCKET_BRIDGE_SERVICE)
    private readonly bridge: IBattleSocketBridgeService,
    @Inject(MATCH_ORCHESTRATOR_SERVICE)
    private readonly orchestrator: IMatchOrchestratorService
  ) {
    this.logger.setContext(BattleGateway.name);
    this.logger.log('Battle Gateway initialized');
  }

  afterInit(server: Server): void {
    this.bridge.setServer(server);
  }

  // ── Connection lifecycle ──────────────────────────────────────────────

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const isValid = await this.wsJwtGuard.validateClient(client);
    if (!isValid || !client.user?.userId) {
      this.logger.warn(`Connection rejected: invalid or missing token`);
      client.disconnect();
      return;
    }

    const userId = client.user.userId;

    this.bridge.registerSocket(client.id, userId);
    this.bridge.subscribeUser(userId);

    this.logger.log(`User ${userId} connected (socket: ${client.id})`);

    // Check if user has an active battle to rejoin
    const activeBattleId = await this.redis.getUserBattle(userId);
    if (activeBattleId) {
      this.logger.log(`User ${userId} has active battle ${activeBattleId}`);

      const battle = this.battleManager.getBattle(activeBattleId);
      if (battle) {
        const slot = battle.config.player1.id === userId ? 'p1' : 'p2';
        const packedTeam = slot === 'p1'
          ? battle.config.player1.packedTeam
          : battle.config.player2.packedTeam;
        const moveAnimConfigs = getMoveAnimConfigs(extractMoveNames(packedTeam));

        this.logger.log(
          `Sending BATTLE_RESTORED to user ${userId} — battle ${activeBattleId}, slot: ${slot}`
        );
        client.emit(BATTLE_EVENT, {
          type: 'BATTLE_RESTORED',
          battleId: activeBattleId,
          currentState: slot === 'p1' ? battle.p1State : battle.p2State,
          moveAnimConfigs,
        } satisfies ServerBattleEvent);
      } else {
        this.logger.log(
          `Sending BATTLE_RESTORED (empty) to user ${userId} — battle ${activeBattleId} needs recovery`
        );
        client.emit(BATTLE_EVENT, {
          type: 'BATTLE_RESTORED',
          battleId: activeBattleId,
          currentState: '',
          moveAnimConfigs: {},
          message: 'Battle needs recovery - please rejoin',
        } satisfies ServerBattleEvent);
      }
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const userId = client.user?.userId;
    if (!userId) return;

    this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);

    this.bridge.unsubscribeUser(userId);

    const battleId = await this.redis.getUserBattle(userId);
    if (battleId) {
      await this.battleManager.handleDisconnect(battleId, userId);
    }

    const wasInQueue = await this.matchmaking.isInQueue(userId);
    await this.matchmaking.leaveQueue(userId);

    this.bridge.unregisterSocket(client.id, userId);

    if (wasInQueue) {
      await this.broadcastQueueCounts();
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Battle Gateway shutting down...');
    await this.bridge.destroy();
  }

  // ── Message handlers ──────────────────────────────────────────────────

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(10, 60000)
  @SubscribeMessage('JOIN_QUEUE')
  async handleJoinQueue(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;
    this.logger.log(`Received JOIN_QUEUE from user ${userId}`);

    const parsed = JoinQueueDTOSchema.safeParse(data);
    if (!parsed.success) {
      this.emitError(client, 'INVALID_INPUT', parsed.error.message);
      return;
    }

    const { format, teamId } = parsed.data;
    this.logger.debug(
      `JOIN_QUEUE details — user ${userId}, format: ${format}, teamId: ${teamId ?? 'random'}`
    );

    try {
      let resolvedTeamId: string;
      let packedTeam: string;

      if (teamId) {
        // Competitive path: fetch and validate user's team
        const team = await this.teamsDb.getTeam(teamId);
        if (!team) {
          this.emitError(client, 'TEAM_NOT_FOUND', 'Team not found');
          return;
        }

        if (team.userId !== userId) {
          this.emitError(client, 'INVALID_TEAM', 'You do not own this team');
          return;
        }

        resolvedTeamId = teamId;
        packedTeam = packTeam(team.pokemon);
      } else {
        // Random path: generate team server-side
        if (!isRandomFormat(format)) {
          this.emitError(
            client,
            'TEAM_REQUIRED',
            'A team is required for this format'
          );
          return;
        }

        resolvedTeamId = 'random';
        packedTeam = generateRandomTeam(format);
      }

      const position = await this.matchmaking.joinQueue(
        userId,
        format,
        resolvedTeamId,
        packedTeam
      );

      this.logger.log(
        `Sending QUEUE_JOINED to user ${userId} — format: ${format}, position: ${position}`
      );
      client.emit(BATTLE_EVENT, {
        type: 'QUEUE_JOINED',
        position,
      } satisfies ServerBattleEvent);

      await this.orchestrator.tryFindMatch(format);
      await this.broadcastQueueCounts();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to join queue';
      this.emitError(client, 'QUEUE_ERROR', message);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(10, 60000)
  @SubscribeMessage('LEAVE_QUEUE')
  async handleLeaveQueue(
    @ConnectedSocket() client: AuthenticatedSocket
  ): Promise<void> {
    const userId = client.user.userId;
    this.logger.log(`Received LEAVE_QUEUE from user ${userId}`);

    await this.matchmaking.leaveQueue(userId);

    this.logger.log(`Sending QUEUE_LEFT to user ${userId}`);
    client.emit(BATTLE_EVENT, {
      type: 'QUEUE_LEFT',
    } satisfies ServerBattleEvent);

    await this.broadcastQueueCounts();
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(5, 60000)
  @SubscribeMessage('DECLINE_MATCH')
  async handleDeclineMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;
    this.logger.log(`Received DECLINE_MATCH from user ${userId}`);

    const parsed = DeclineMatchDTOSchema.safeParse(data);
    if (!parsed.success) {
      this.emitError(client, 'INVALID_INPUT', parsed.error.message);
      return;
    }

    try {
      await this.orchestrator.declineMatch(userId, parsed.data.battleId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to decline match';
      this.emitError(client, 'DECLINE_MATCH_ERROR', message);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(2, 1000)
  @SubscribeMessage('MOVE')
  async handleMove(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;
    this.logger.debug(`Received MOVE from user ${userId}`);

    const parsed = BattleMoveDTOSchema.safeParse(data);
    if (!parsed.success) {
      this.emitError(client, 'INVALID_INPUT', parsed.error.message);
      return;
    }

    const { battleId, choice } = parsed.data;
    this.logger.debug(
      `Received MOVE from user ${userId} — battle ${battleId}, choice: ${choice}`
    );

    try {
      await this.battleManager.processChoice(battleId, userId, choice);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to process move';
      this.emitError(client, 'MOVE_ERROR', message);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(2, 1000)
  @SubscribeMessage('CANCEL_CHOICE')
  async handleCancelChoice(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;
    this.logger.debug(`Received CANCEL_CHOICE from user ${userId}`);

    const parsed = CancelChoiceDTOSchema.safeParse(data);
    if (!parsed.success) {
      this.emitError(client, 'INVALID_INPUT', parsed.error.message);
      return;
    }

    try {
      await this.battleManager.cancelChoice(parsed.data.battleId, userId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to cancel choice';
      this.emitError(client, 'CANCEL_CHOICE_ERROR', message);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(1, 5000)
  @SubscribeMessage('FORFEIT')
  async handleForfeit(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;

    const parsed = ForfeitDTOSchema.safeParse(data);
    if (!parsed.success) {
      this.emitError(client, 'INVALID_INPUT', parsed.error.message);
      return;
    }

    const { battleId } = parsed.data;
    this.logger.log(
      `Received FORFEIT from user ${userId} — battle ${battleId}`
    );

    try {
      await this.battleManager.forfeit(battleId, userId);
      this.logger.log(`User ${userId} forfeited battle ${battleId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to forfeit';
      this.emitError(client, 'FORFEIT_ERROR', message);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(5, 60000)
  @SubscribeMessage('REJOIN')
  async handleRejoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;

    const parsed = RejoinDTOSchema.safeParse(data);
    if (!parsed.success) {
      this.emitError(client, 'INVALID_INPUT', parsed.error.message);
      return;
    }

    const { battleId } = parsed.data;
    this.logger.log(`Received REJOIN from user ${userId} — battle ${battleId}`);

    try {
      const battle = await this.battleManager.handleReconnect(battleId, userId);

      await client.join(BattleRooms.battle(battleId));
      this.bridge.subscribeBattle(battleId);

      const slot = battle.config.player1.id === userId ? 'p1' : 'p2';
      const packedTeam = slot === 'p1'
        ? battle.config.player1.packedTeam
        : battle.config.player2.packedTeam;
      const moveAnimConfigs = getMoveAnimConfigs(extractMoveNames(packedTeam));

      this.logger.log(
        `Sending BATTLE_RESTORED (rejoin) to user ${userId} — battle ${battle.id}, slot: ${slot}`
      );
      client.emit(BATTLE_EVENT, {
        type: 'BATTLE_RESTORED',
        battleId: battle.id,
        currentState: slot === 'p1' ? battle.p1State : battle.p2State,
        moveAnimConfigs,
      } satisfies ServerBattleEvent);

      this.logger.log(`User ${userId} rejoined battle ${battleId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to rejoin battle';
      this.emitError(client, 'REJOIN_ERROR', message, false);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(5, 60000)
  @SubscribeMessage('SAVE_REPLAY')
  async handleSaveReplay(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;

    const parsed = SaveReplayDTOSchema.safeParse(data);
    if (!parsed.success) {
      this.emitError(client, 'INVALID_INPUT', parsed.error.message);
      return;
    }

    const { battleId } = parsed.data;
    this.logger.log(
      `Received SAVE_REPLAY from user ${userId} — battle ${battleId}`
    );

    try {
      const canSave = await this.persistence.canSaveReplay(userId);
      if (!canSave) {
        this.emitError(
          client,
          'MAX_REPLAYS_REACHED',
          'You have reached the maximum number of saved replays (10). Delete a replay to save new ones.'
        );
        return;
      }

      const metadata = await this.redis.getBattleMetadata(battleId);
      if (!metadata) {
        this.emitError(
          client,
          'REPLAY_WINDOW_EXPIRED',
          'Battle data has expired. Replays can only be saved within 5 minutes of battle end.',
          false
        );
        return;
      }

      const config = JSON.parse(metadata.config) as BattleConfig;
      const battleLog = await this.redis.getBattleLog(battleId);

      const result = await this.persistence.saveReplay(userId, {
        battleId,
        config,
        battleLog,
        winnerId: metadata.winnerId || null,
        playedAt: new Date(),
      });

      client.emit(BATTLE_EVENT, {
        type: 'REPLAY_SAVED',
        battleId,
        replayCount: result.replayCount,
      } satisfies ServerBattleEvent);

      this.logger.log(`User ${userId} saved replay for battle ${battleId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save replay';
      this.emitError(client, 'SAVE_REPLAY_ERROR', message);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(10, 60000)
  @SubscribeMessage('OBSERVE_QUEUE')
  async handleObserveQueue(
    @ConnectedSocket() client: AuthenticatedSocket
  ): Promise<void> {
    await client.join(BattleRooms.lobby);
    // Send current counts immediately so the client doesn't start empty
    const counts = await this.matchmaking.getQueueCounts();
    client.emit(BATTLE_EVENT, {
      type: 'QUEUE_COUNTS',
      counts,
    } satisfies ServerBattleEvent);
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(10, 60000)
  @SubscribeMessage('UNOBSERVE_QUEUE')
  handleUnobserveQueue(
    @ConnectedSocket() client: AuthenticatedSocket
  ): void {
    client.leave(BattleRooms.lobby);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private async broadcastQueueCounts(): Promise<void> {
    const counts = await this.matchmaking.getQueueCounts();
    this.server.to(BattleRooms.lobby).emit(BATTLE_EVENT, {
      type: 'QUEUE_COUNTS',
      counts,
    } satisfies ServerBattleEvent);
  }

  private emitError(
    client: AuthenticatedSocket,
    code: string,
    message: string,
    recoverable = true
  ): void {
    this.logger.warn(
      `Sending ERROR to user ${client.user?.userId} — ${code}: ${message}`
    );
    client.emit(BATTLE_EVENT, {
      type: 'ERROR',
      code,
      message,
      recoverable,
    } satisfies ServerBattleEvent);
  }
}
