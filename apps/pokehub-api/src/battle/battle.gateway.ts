import { WsJwtGuard, type AuthenticatedSocket } from './guards/ws-jwt.guard';
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
import { Inject, UseGuards } from '@nestjs/common';
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
  type MatchFoundMessage,
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
  BATTLE_NAMESPACE,
  BattleRooms,
  BATTLE_EVENT,
} from '@pokehub/shared/pokemon-battle-types';
import { packTeam } from '@pokehub/shared/pokemon-showdown-validation';
import { randomUUID } from 'crypto';
import { Server } from 'socket.io';

// Track socket to user mapping
const socketToUser = new Map<string, string>();
const userToSocket = new Map<string, string>();

@WebSocketGateway({
  namespace: BATTLE_NAMESPACE,
  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:4200',
    credentials: true,
  },
})
export class BattleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly subscriberClient: ReturnType<
    RedisService['createSubscriberClient']
  >;

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
      // Handle match found: match:user:{userId}
      const matchUserId = RedisKeys.channels.parseMatchFoundUserId(channel);
      if (matchUserId) {
        this.handleMatchFoundMessage(matchUserId, JSON.parse(message));
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

  private handleMatchFoundMessage(
    userId: string,
    message: MatchFoundMessage
  ): void {
    const socketId = userToSocket.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(BATTLE_EVENT, {
        type: 'MATCH_FOUND',
        battleId: message.battleId,
        opponent: {
          id: message.opponentId,
          name: message.opponentName,
        },
      } satisfies ServerBattleEvent);
    }
  }

  private handleBattleUpdateMessage(
    battleId: string,
    message: BattleUpdateMessage
  ): void {
    const room = BattleRooms.battle(battleId);

    switch (message.type) {
      case 'state':
        // Raw battle state from @pkmn/sim
        this.server.to(room).emit(BATTLE_EVENT, {
          type: 'BATTLE_UPDATE',
          battleId,
          data: message.data,
        } satisfies ServerBattleEvent);
        break;

      case 'event':
        // Structured battle events
        this.handleBattleEvent(battleId, room, message.data);
        break;

      case 'end':
        // Battle ended
        this.server.to(room).emit(BATTLE_EVENT, {
          type: 'BATTLE_END',
          battleId,
          winner: message.data.winnerId,
          reason: message.data.reason,
          canSaveReplay: true,
        } satisfies ServerBattleEvent);
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
        this.server.to(room).emit(BATTLE_EVENT, {
          type: 'OPPONENT_DISCONNECTED',
          battleId,
          timeout: 120, // 2 minutes
        } satisfies ServerBattleEvent);
        break;

      case 'opponent_reconnected':
        this.server.to(room).emit(BATTLE_EVENT, {
          type: 'OPPONENT_RECONNECTED',
          battleId,
        } satisfies ServerBattleEvent);
        break;

      case 'turn_warning':
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
    setInterval(() => {
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
    if (!isValid) {
      this.logger.warn(`Connection rejected: invalid or missing token`);
      client.disconnect();
      return;
    }

    const userId = client.user.userId;

    // Track the connection
    socketToUser.set(client.id, userId);
    userToSocket.set(userId, client.id);

    this.logger.log(`User ${userId} connected (socket: ${client.id})`);

    // Subscribe to match notifications for this user
    if (this.subscriberClient) {
      void this.subscriberClient.subscribe(
        RedisKeys.channels.matchFound(userId)
      );
    }

    // Check if user has an active battle to rejoin
    const activeBattleId = await this.redis.getUserBattle(userId);
    if (activeBattleId) {
      this.logger.log(`User ${userId} has active battle ${activeBattleId}`);

      // Try to get current battle state
      const battle = this.battleManager.getBattle(activeBattleId);
      client.emit(BATTLE_EVENT, {
        type: 'BATTLE_RESTORED',
        battleId: activeBattleId,
        currentState: battle?.currentState ?? '',
        message: battle ? undefined : 'Battle needs recovery - please rejoin',
      } satisfies ServerBattleEvent);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const userId = socketToUser.get(client.id);
    if (!userId) return;

    this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);

    // Unsubscribe from match notifications
    if (this.subscriberClient) {
      void this.subscriberClient.unsubscribe(
        RedisKeys.channels.matchFound(userId)
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
    socketToUser.delete(client.id);
    userToSocket.delete(userId);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('JOIN_QUEUE')
  async handleJoinQueue(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;

    // Validate input
    const parsed = JoinQueueDTOSchema.safeParse(data);
    if (!parsed.success) {
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'INVALID_INPUT',
        message: parsed.error.message,
        recoverable: true,
      } satisfies ServerBattleEvent);
      return;
    }

    const { format, teamId } = parsed.data;

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

      client.emit(BATTLE_EVENT, {
        type: 'QUEUE_JOINED',
        position,
      } satisfies ServerBattleEvent);

      this.logger.log(
        `User ${userId} joined ${format} queue at position ${position}`
      );

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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('LEAVE_QUEUE')
  async handleLeaveQueue(
    @ConnectedSocket() client: AuthenticatedSocket
  ): Promise<void> {
    const userId = client.user.userId;

    await this.matchmaking.leaveQueue(userId);

    client.emit(BATTLE_EVENT, {
      type: 'QUEUE_LEFT',
    } satisfies ServerBattleEvent);

    this.logger.log(`User ${userId} left queue`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('MOVE')
  async handleMove(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: unknown
  ): Promise<void> {
    const userId = client.user.userId;

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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('FORFEIT')
  async handleForfeit(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { battleId: string }
  ): Promise<void> {
    const userId = client.user.userId;
    const { battleId } = data;

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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('REJOIN')
  async handleRejoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { battleId: string }
  ): Promise<void> {
    const userId = client.user.userId;
    const { battleId } = data;

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

      client.emit(BATTLE_EVENT, {
        type: 'BATTLE_START',
        battleId: battle.id,
        initialState: battle.currentState,
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

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('SAVE_REPLAY')
  async handleSaveReplay(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { battleId: string }
  ): Promise<void> {
    const userId = client.user.userId;
    const { battleId } = data;

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
        winnerId: null, // TODO: Get from battle end data
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

      // Notify both players
      await Promise.all([
        this.redis.publishMatchFound(player1.userId, {
          battleId,
          opponentId: player2.userId,
          opponentName: user2Name,
        }),
        this.redis.publishMatchFound(player2.userId, {
          battleId,
          opponentId: player1.userId,
          opponentName: user1Name,
        }),
      ]);

      // Join both players to the battle room (if on this server)
      const socket1 = userToSocket.get(player1.userId);
      const socket2 = userToSocket.get(player2.userId);

      // Join both players to the battle room and emit BATTLE_START
      const battleRoom = BattleRooms.battle(battleId);

      if (socket1) {
        // Use fetchSockets to get the actual socket and join the room
        const sockets1 = await this.server.in(socket1).fetchSockets();
        if (sockets1.length > 0) {
          await sockets1[0].join(battleRoom);
          sockets1[0].emit(BATTLE_EVENT, {
            type: 'BATTLE_START',
            battleId,
            initialState: battle.currentState,
          } satisfies ServerBattleEvent);
        }
      }

      if (socket2) {
        const sockets2 = await this.server.in(socket2).fetchSockets();
        if (sockets2.length > 0) {
          await sockets2[0].join(battleRoom);
          sockets2[0].emit(BATTLE_EVENT, {
            type: 'BATTLE_START',
            battleId,
            initialState: battle.currentState,
          } satisfies ServerBattleEvent);
        }
      }

      this.logger.log(
        `Battle ${battleId} started: ${user1Name} vs ${user2Name}`
      );
    } catch (error) {
      this.logger.error(`Failed to create battle: ${error}`);
    }
  }
}
