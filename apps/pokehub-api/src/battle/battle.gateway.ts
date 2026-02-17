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
import { Inject, OnModuleDestroy, UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import {
  REDIS_SERVICE,
  type RedisService,
  type BattleUpdateMessage,
  type BattleEventPayload,
  RedisKeys,
} from '@pokehub/backend/pokehub-redis';
import {
  TEAMS_DB_SERVICE,
  type ITeamsDBService,
} from '@pokehub/backend/pokehub-teams-db';
import {
  USERS_DB_SERVICE,
  type IUsersDBService,
} from '@pokehub/backend/pokehub-users-db';
import { AppLogger } from '@pokehub/backend/shared-logger';
import {
  type BattleConfig,
  generateBattleSeed,
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
import { packTeam } from '@pokehub/shared/pokemon-showdown-validation';
import { randomUUID } from 'crypto';
import { Server } from 'socket.io';

@WebSocketGateway({
  namespace: BATTLE_NAMESPACE,
  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:4200',
    credentials: true,
  },
})
export class BattleGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer() server!: Server;

  private readonly subscriberClient: ReturnType<
    RedisService['createSubscriberClient']
  >;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // Track socket to user mapping
  private readonly socketToUser = new Map<string, string>();
  private readonly userToSocket = new Map<string, string>();

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
    @Inject(USERS_DB_SERVICE) private readonly usersDb: IUsersDBService
  ) {
    this.logger.setContext(BattleGateway.name);
    this.subscriberClient = this.redis.createSubscriberClient();
    this.setupRedisSubscriptions();
    this.startHeartbeat();
    this.logger.log('Battle Gateway initialized');
  }

  private setupRedisSubscriptions(): void {
    // Handle connection events
    this.subscriberClient.on('ready', () => {
      this.logger.log('Redis subscriber connected and ready');
    });

    this.subscriberClient.on('error', (err: Error) => {
      this.logger.error(`Redis subscriber error: ${err.message}`);
    });

    this.subscriberClient.on('end', () => {
      this.logger.warn('Redis subscriber connection closed');
    });

    this.subscriberClient.on('reconnecting', (delay: number) => {
      this.logger.log(`Redis subscriber reconnecting in ${delay}ms`);
    });

    // Handle pub/sub messages
    this.subscriberClient.on('message', (channel: string, message: string) => {
      this.handleRedisMessage(channel, message);
    });

    this.logger.log('Redis pub/sub subscriptions initialized');
  }

  private handleRedisMessage(channel: string, message: string): void {
    try {
      // Handle per-user battle events: user:{userId}:battle-events
      const eventUserId =
        RedisKeys.channels.parseUserBattleEventUserId(channel);
      if (eventUserId) {
        const event: ServerBattleEvent = JSON.parse(message);
        const socketId = this.userToSocket.get(eventUserId);
        if (socketId) {
          this.logger.debug(
            `Forwarding ${event.type} from Redis to user ${eventUserId}`
          );
          this.server.to(socketId).emit(BATTLE_EVENT, event);
        } else {
          this.logger.warn(
            `Cannot forward ${event.type} to user ${eventUserId} — no socket found`
          );
        }
        return;
      }

      // Handle battle updates: battle:{battleId}:update
      const battleId = RedisKeys.channels.parseBattleUpdateId(channel);
      if (battleId) {
        this.handleBattleUpdateMessage(battleId, JSON.parse(message));
        return;
      }
    } catch (error) {
      this.logger.error(`Error handling Redis message: ${error}`);
    }
  }

  private handleBattleUpdateMessage(
    battleId: string,
    message: BattleUpdateMessage
  ): void {
    const room = BattleRooms.battle(battleId);

    this.logger.debug(
      `Battle update received — battle ${battleId}, type: ${message.type}`
    );

    switch (message.type) {
      case 'state': {
        // Send each player their own perspective (opponent info redacted)
        this.logger.debug(
          `Sending BATTLE_UPDATE — battle ${battleId}, p1Data: ${message.p1Data.length} chars, p2Data: ${message.p2Data.length} chars`
        );

        this.emitToUser(message.p1Id, {
          type: 'BATTLE_UPDATE',
          battleId,
          data: message.p1Data,
        });
        this.emitToUser(message.p2Id, {
          type: 'BATTLE_UPDATE',
          battleId,
          data: message.p2Data,
        });
        break;
      }

      case 'event':
        // Structured battle events
        this.logger.debug(
          `Sending battle event — battle ${battleId}, event: ${message.data.event}`
        );
        this.handleBattleEvent(battleId, room, message.data);
        break;

      case 'end':
        // Battle ended
        this.logger.log(
          `Sending BATTLE_END — battle ${battleId}, winner: ${
            message.data.winnerId ?? 'draw'
          }, reason: ${message.data.reason}`
        );
        this.server.to(room).emit(BATTLE_EVENT, {
          type: 'BATTLE_END',
          battleId,
          winner: message.data.winnerId,
          reason: message.data.reason,
          canSaveReplay: true,
        } satisfies ServerBattleEvent);

        // Unsubscribe from battle updates now that battle has ended
        if (this.subscriberClient) {
          void this.subscriberClient.unsubscribe(
            RedisKeys.channels.battleUpdate(battleId)
          );
        }
        break;
    }
  }

  private handleBattleEvent(
    battleId: string,
    room: string,
    event: BattleEventPayload
  ): void {
    switch (event.event) {
      case 'opponent_disconnected':
        this.logger.log(`Sending OPPONENT_DISCONNECTED — battle ${battleId}`);
        this.server.to(room).emit(BATTLE_EVENT, {
          type: 'OPPONENT_DISCONNECTED',
          battleId,
          timeout: 120, // 2 minutes
        } satisfies ServerBattleEvent);
        break;

      case 'opponent_reconnected':
        this.logger.log(`Sending OPPONENT_RECONNECTED — battle ${battleId}`);
        this.server.to(room).emit(BATTLE_EVENT, {
          type: 'OPPONENT_RECONNECTED',
          battleId,
        } satisfies ServerBattleEvent);
        break;

      case 'turn_warning':
        this.logger.log(
          `Sending TURN_WARNING — battle ${battleId}, ${event.secondsRemaining}s remaining`
        );
        this.server.to(room).emit(BATTLE_EVENT, {
          type: 'TURN_WARNING',
          battleId,
          secondsRemaining: event.secondsRemaining,
        } satisfies ServerBattleEvent);
        break;
    }
  }

  private startHeartbeat(): void {
    // Refresh heartbeat every 5 seconds
    this.heartbeatInterval = setInterval(() => {
      void this.redis.refreshHeartbeat();
    }, 5000);

    // Initial heartbeat
    void this.redis.refreshHeartbeat();
    this.logger.log('Server heartbeat started');
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    // Validate JWT on connection and attach user data to socket
    // Guards on @SubscribeMessage handlers provide per-message auth,
    // but we also validate here to reject invalid connections immediately
    const isValid = await this.wsJwtGuard.validateClient(client);
    if (!isValid || !client.user?.userId) {
      this.logger.warn(`Connection rejected: invalid or missing token`);
      client.disconnect();
      return;
    }

    const userId = client.user.userId;

    // Track the connection
    this.socketToUser.set(client.id, userId);
    this.userToSocket.set(userId, client.id);

    this.logger.log(`User ${userId} connected (socket: ${client.id})`);

    // Subscribe to per-user battle events (for cross-server delivery)
    if (this.subscriberClient) {
      void this.subscriberClient.subscribe(
        RedisKeys.channels.userBattleEvent(userId)
      );
    }

    // Check if user has an active battle to rejoin
    const activeBattleId = await this.redis.getUserBattle(userId);
    if (activeBattleId) {
      this.logger.log(`User ${userId} has active battle ${activeBattleId}`);

      // Try to get current battle state
      const battle = this.battleManager.getBattle(activeBattleId);
      if (battle) {
        const slot = battle.config.player1.id === userId ? 'p1' : 'p2';
        this.logger.log(
          `Sending BATTLE_RESTORED to user ${userId} — battle ${activeBattleId}, slot: ${slot}`
        );
        client.emit(BATTLE_EVENT, {
          type: 'BATTLE_RESTORED',
          battleId: activeBattleId,
          currentState: slot === 'p1' ? battle.p1State : battle.p2State,
        } satisfies ServerBattleEvent);
      } else {
        this.logger.log(
          `Sending BATTLE_RESTORED (empty) to user ${userId} — battle ${activeBattleId} needs recovery`
        );
        client.emit(BATTLE_EVENT, {
          type: 'BATTLE_RESTORED',
          battleId: activeBattleId,
          currentState: '',
          message: 'Battle needs recovery - please rejoin',
        } satisfies ServerBattleEvent);
      }
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const userId = this.socketToUser.get(client.id);
    if (!userId) return;

    this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);

    // Unsubscribe from per-user battle events
    if (this.subscriberClient) {
      void this.subscriberClient.unsubscribe(
        RedisKeys.channels.userBattleEvent(userId)
      );
    }

    // Check if user is in a battle
    const battleId = await this.redis.getUserBattle(userId);
    if (battleId) {
      await this.battleManager.handleDisconnect(battleId, userId);
    }

    // Remove from queue if queued
    await this.matchmaking.leaveQueue(userId);

    // Clean up mappings
    this.socketToUser.delete(client.id);
    this.userToSocket.delete(userId);
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Battle Gateway shutting down...');

    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Disconnect Redis subscriber
    if (this.subscriberClient) {
      try {
        await this.subscriberClient.quit();
        this.logger.log('Redis subscriber disconnected');
      } catch (error) {
        this.logger.error(`Error disconnecting Redis subscriber: ${error}`);
      }
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(10, 60000) // 10 requests per minute
  @SubscribeMessage('JOIN_QUEUE')
  async handleJoinQueue(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;

    this.logger.log(`Received JOIN_QUEUE from user ${userId}`);

    // Validate input
    const parsed = JoinQueueDTOSchema.safeParse(data);
    if (!parsed.success) {
      this.logger.warn(
        `Sending ERROR to user ${userId} — INVALID_INPUT: ${parsed.error.message}`
      );
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'INVALID_INPUT',
        message: parsed.error.message,
        recoverable: true,
      } satisfies ServerBattleEvent);
      return;
    }

    const { format, teamId } = parsed.data;

    this.logger.debug(
      `JOIN_QUEUE details — user ${userId}, format: ${format}, teamId: ${teamId}`
    );

    try {
      // Fetch the team and pack it
      const team = await this.teamsDb.getTeam(teamId);
      if (!team) {
        client.emit(BATTLE_EVENT, {
          type: 'ERROR',
          code: 'TEAM_NOT_FOUND',
          message: 'Team not found',
          recoverable: true,
        } satisfies ServerBattleEvent);
        return;
      }

      // Verify team ownership
      if (team.userId !== userId) {
        client.emit(BATTLE_EVENT, {
          type: 'ERROR',
          code: 'INVALID_TEAM',
          message: 'You do not own this team',
          recoverable: true,
        } satisfies ServerBattleEvent);
        return;
      }

      // Pack the team for battle
      const packedTeam = packTeam(team.pokemon);

      // Join the queue
      const position = await this.matchmaking.joinQueue(
        userId,
        format,
        teamId,
        packedTeam
      );

      this.logger.log(
        `Sending QUEUE_JOINED to user ${userId} — format: ${format}, position: ${position}`
      );
      client.emit(BATTLE_EVENT, {
        type: 'QUEUE_JOINED',
        position,
      } satisfies ServerBattleEvent);

      // Try to find a match
      await this.tryFindMatch(format);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to join queue';
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'QUEUE_ERROR',
        message,
        recoverable: true,
      } satisfies ServerBattleEvent);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(10, 60000) // 10 requests per minute
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
  }

  /**
   * Handle a client declining a match they were paired into.
   * This happens when the client receives MATCH_FOUND but the user had already
   * left the queue from their perspective (TOCTOU race between leave and match).
   *
   * The declining player forfeits, and the opponent is notified and requeued.
   */
  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(5, 60000) // 5 requests per minute
  @SubscribeMessage('DECLINE_MATCH')
  async handleDeclineMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;

    this.logger.log(`Received DECLINE_MATCH from user ${userId}`);

    // Validate input
    const parsed = DeclineMatchDTOSchema.safeParse(data);
    if (!parsed.success) {
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'INVALID_INPUT',
        message: parsed.error.message,
        recoverable: true,
      } satisfies ServerBattleEvent);
      return;
    }

    const { battleId } = parsed.data;

    try {
      // Get battle metadata to find the opponent
      const metadata = await this.redis.getBattleMetadata(battleId);
      if (!metadata) {
        this.logger.warn(
          `User ${userId} tried to decline non-existent battle ${battleId}`
        );
        return;
      }

      const config: BattleConfig = JSON.parse(metadata.config);

      // Determine who the opponent is
      const isPlayer1 = config.player1.id === userId;
      const isPlayer2 = config.player2.id === userId;

      if (!isPlayer1 && !isPlayer2) {
        this.logger.warn(
          `User ${userId} tried to decline battle ${battleId} they're not in`
        );
        return;
      }

      const opponentId = isPlayer1 ? config.player2.id : config.player1.id;
      const opponentTeamId = isPlayer1
        ? config.player2.teamId
        : config.player1.teamId;
      const opponentPackedTeam = isPlayer1
        ? config.player2.packedTeam
        : config.player1.packedTeam;

      this.logger.log(
        `User ${userId} declined match ${battleId}, requeuing opponent ${opponentId}`
      );

      // Clean up the battle (it never really started)
      await this.battleManager.cancelBattle(battleId);

      // Notify the opponent and requeue them
      this.logger.log(
        `Sending MATCH_CANCELLED to opponent ${opponentId} — battle ${battleId}`
      );
      this.emitToUser(opponentId, {
        type: 'MATCH_CANCELLED',
        battleId,
        reason: 'opponent_declined',
      });

      // Requeue the opponent
      await this.matchmaking.joinQueue(
        opponentId,
        config.format,
        opponentTeamId,
        opponentPackedTeam
      );

      // Try to find a new match for the requeued player
      await this.tryFindMatch(config.format);
    } catch (error) {
      this.logger.error(`Error handling decline match: ${error}`);
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'DECLINE_MATCH_ERROR',
        message: 'Failed to decline match',
        recoverable: true,
      } satisfies ServerBattleEvent);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(2, 1000) // 2 requests per second
  @SubscribeMessage('MOVE')
  async handleMove(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;

    this.logger.debug(`Received MOVE from user ${userId}`);

    // Validate input
    const parsed = BattleMoveDTOSchema.safeParse(data);
    if (!parsed.success) {
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'INVALID_INPUT',
        message: parsed.error.message,
        recoverable: true,
      } satisfies ServerBattleEvent);
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
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'MOVE_ERROR',
        message,
        recoverable: true,
      } satisfies ServerBattleEvent);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(2, 1000) // 2 requests per second
  @SubscribeMessage('CANCEL_CHOICE')
  async handleCancelChoice(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;

    this.logger.debug(`Received CANCEL_CHOICE from user ${userId}`);

    const parsed = CancelChoiceDTOSchema.safeParse(data);
    if (!parsed.success) {
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'INVALID_INPUT',
        message: parsed.error.message,
        recoverable: true,
      } satisfies ServerBattleEvent);
      return;
    }

    try {
      await this.battleManager.cancelChoice(parsed.data.battleId, userId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to cancel choice';
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'CANCEL_CHOICE_ERROR',
        message,
        recoverable: true,
      } satisfies ServerBattleEvent);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(1, 5000) // 1 request per 5 seconds
  @SubscribeMessage('FORFEIT')
  async handleForfeit(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { battleId: string }
  ): Promise<void> {
    const userId = client.user.userId;

    // Validate input
    const parsed = ForfeitDTOSchema.safeParse(data);
    if (!parsed.success) {
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'INVALID_INPUT',
        message: parsed.error.message,
        recoverable: true,
      } satisfies ServerBattleEvent);
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
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'FORFEIT_ERROR',
        message,
        recoverable: true,
      } satisfies ServerBattleEvent);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(5, 60000) // 5 requests per minute
  @SubscribeMessage('REJOIN')
  async handleRejoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { battleId: string }
  ): Promise<void> {
    const userId = client.user.userId;

    // Validate input
    const parsed = RejoinDTOSchema.safeParse(data);
    if (!parsed.success) {
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'INVALID_INPUT',
        message: parsed.error.message,
        recoverable: true,
      } satisfies ServerBattleEvent);
      return;
    }

    const { battleId } = parsed.data;

    this.logger.log(`Received REJOIN from user ${userId} — battle ${battleId}`);

    try {
      const battle = await this.battleManager.handleReconnect(battleId, userId);

      // Join the battle room
      await client.join(BattleRooms.battle(battleId));

      // Subscribe to battle updates
      if (this.subscriberClient) {
        void this.subscriberClient.subscribe(
          RedisKeys.channels.battleUpdate(battleId)
        );
      }

      // Send the correct perspective based on player slot
      const slot = battle.config.player1.id === userId ? 'p1' : 'p2';
      this.logger.log(
        `Sending BATTLE_START (rejoin) to user ${userId} — battle ${battle.id}, slot: ${slot}`
      );
      client.emit(BATTLE_EVENT, {
        type: 'BATTLE_START',
        battleId: battle.id,
        initialState: slot === 'p1' ? battle.p1State : battle.p2State,
      } satisfies ServerBattleEvent);

      this.logger.log(`User ${userId} rejoined battle ${battleId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to rejoin battle';
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'REJOIN_ERROR',
        message,
        recoverable: false,
      } satisfies ServerBattleEvent);
    }
  }

  @UseGuards(WsJwtGuard, WsThrottlerGuard)
  @WsThrottle(5, 60000) // 5 requests per minute
  @SubscribeMessage('SAVE_REPLAY')
  async handleSaveReplay(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { battleId: string }
  ): Promise<void> {
    const userId = client.user.userId;

    // Validate input
    const parsed = SaveReplayDTOSchema.safeParse(data);
    if (!parsed.success) {
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'INVALID_INPUT',
        message: parsed.error.message,
        recoverable: true,
      } satisfies ServerBattleEvent);
      return;
    }

    const { battleId } = parsed.data;

    this.logger.log(
      `Received SAVE_REPLAY from user ${userId} — battle ${battleId}`
    );

    try {
      // Check if user can save more replays
      const canSave = await this.persistence.canSaveReplay(userId);
      if (!canSave) {
        client.emit(BATTLE_EVENT, {
          type: 'ERROR',
          code: 'MAX_REPLAYS_REACHED',
          message:
            'You have reached the maximum number of saved replays (10). Delete a replay to save new ones.',
          recoverable: true,
        } satisfies ServerBattleEvent);
        return;
      }

      // Get battle metadata and log from Redis
      const metadata = await this.redis.getBattleMetadata(battleId);
      if (!metadata) {
        client.emit(BATTLE_EVENT, {
          type: 'ERROR',
          code: 'REPLAY_WINDOW_EXPIRED',
          message:
            'Battle data has expired. Replays can only be saved within 5 minutes of battle end.',
          recoverable: false,
        } satisfies ServerBattleEvent);
        return;
      }

      const config = JSON.parse(metadata.config) as BattleConfig;
      const battleLog = await this.redis.getBattleLog(battleId);

      // Save the replay
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
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'SAVE_REPLAY_ERROR',
        message,
        recoverable: true,
      } satisfies ServerBattleEvent);
    }
  }

  /**
   * Emit a battle event to a user. If the user's socket is on this server,
   * emit directly for guaranteed ordering. Otherwise publish via Redis
   * pub/sub for cross-server delivery.
   */
  private emitToUser(userId: string, event: ServerBattleEvent): void {
    const socketId = this.userToSocket.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(BATTLE_EVENT, event);
    } else {
      void this.redis.publishUserBattleEvent(userId, event);
    }
  }

  /**
   * Try to find a match for a format and create a battle if successful
   */
  private async tryFindMatch(format: string): Promise<void> {
    const match = await this.matchmaking.findMatch(format);
    if (!match) return;

    const { player1, player2 } = match;

    try {
      // Get player names
      const [user1, user2] = await Promise.all([
        this.usersDb.getUser(player1.userId),
        this.usersDb.getUser(player2.userId),
      ]);

      if (!user1 || !user2) {
        this.logger.error('Failed to get user info for match');
        return;
      }

      // Use username or fallback to a default
      const user1Name =
        user1.username ?? `Player ${player1.userId.slice(0, 8)}`;
      const user2Name =
        user2.username ?? `Player ${player2.userId.slice(0, 8)}`;

      // Create battle config
      const battleId = randomUUID();
      const config: BattleConfig = {
        id: battleId,
        format,
        player1: {
          id: player1.userId,
          name: user1Name,
          teamId: player1.teamId,
          packedTeam: player1.packedTeam,
        },
        player2: {
          id: player2.userId,
          name: user2Name,
          teamId: player2.teamId,
          packedTeam: player2.packedTeam,
        },
        seed: generateBattleSeed(),
      };

      // Create the battle
      const battle = await this.battleManager.createBattle(config);

      // Subscribe to battle updates
      if (this.subscriberClient) {
        void this.subscriberClient.subscribe(
          RedisKeys.channels.battleUpdate(battleId)
        );
      }

      // Join local players to the battle room
      const battleRoom = BattleRooms.battle(battleId);
      const socket1 = this.userToSocket.get(player1.userId);
      const socket2 = this.userToSocket.get(player2.userId);

      if (socket1) {
        const sockets1 = await this.server.in(socket1).fetchSockets();
        if (sockets1.length > 0) {
          await sockets1[0].join(battleRoom);
        }
      }
      if (socket2) {
        const sockets2 = await this.server.in(socket2).fetchSockets();
        if (sockets2.length > 0) {
          await sockets2[0].join(battleRoom);
        }
      }

      // Send MATCH_FOUND then BATTLE_START to each player.
      // emitToUser delivers directly if local, or via Redis if remote,
      // guaranteeing correct ordering either way.
      this.emitToUser(player1.userId, {
        type: 'MATCH_FOUND',
        battleId,
        opponent: { id: player2.userId, name: user2Name },
      });
      this.logger.log(
        `Sending BATTLE_START to p1 ${player1.userId} — battle ${battleId}, initialState: ${battle.p1State.length} chars`
      );
      this.emitToUser(player1.userId, {
        type: 'BATTLE_START',
        battleId,
        initialState: battle.p1State,
      });

      this.emitToUser(player2.userId, {
        type: 'MATCH_FOUND',
        battleId,
        opponent: { id: player1.userId, name: user1Name },
      });
      this.logger.log(
        `Sending BATTLE_START to p2 ${player2.userId} — battle ${battleId}, initialState: ${battle.p2State.length} chars`
      );
      this.emitToUser(player2.userId, {
        type: 'BATTLE_START',
        battleId,
        initialState: battle.p2State,
      });

      this.logger.log(
        `Battle ${battleId} started: ${user1Name} vs ${user2Name}`
      );
    } catch (error) {
      this.logger.error(`Failed to create battle: ${error}`);
    }
  }
}
