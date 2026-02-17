import { Inject, Injectable } from '@nestjs/common';
import {
  BATTLE_SOCKET_BRIDGE_SERVICE,
  type IBattleSocketBridgeService,
} from './battle-socket-bridge.service.interface';
import {
  REDIS_SERVICE,
  type RedisService,
  type BattleUpdateMessage,
  type BattleEventPayload,
  RedisKeys,
} from '@pokehub/backend/pokehub-redis';
import {
  type ServerBattleEvent,
  BattleRooms,
  BATTLE_EVENT,
} from '@pokehub/shared/pokemon-battle-types';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { Server } from 'socket.io';
import type { Provider } from '@nestjs/common';

@Injectable()
class BattleSocketBridgeService implements IBattleSocketBridgeService {
  private server!: Server;
  private readonly subscriberClient: ReturnType<
    RedisService['createSubscriberClient']
  >;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private readonly socketToUser = new Map<string, string>();
  private readonly userToSocket = new Map<string, string>();
  private redisDown = false;

  constructor(
    private readonly logger: AppLogger,
    @Inject(REDIS_SERVICE) private readonly redis: RedisService
  ) {
    this.logger.setContext(BattleSocketBridgeService.name);
    this.subscriberClient = this.redis.createSubscriberClient();
    this.setupRedisSubscriptions();
    this.startHeartbeat();
    this.logger.log('BattleSocketBridgeService initialized');
  }

  setServer(server: Server): void {
    this.server = server;
  }

  getServer(): Server {
    return this.server;
  }

  registerSocket(socketId: string, userId: string): void {
    this.socketToUser.set(socketId, userId);
    this.userToSocket.set(userId, socketId);

    // If Redis is currently down, immediately inform the newly connected
    // client so it doesn't assume the server is healthy.
    if (this.redisDown) {
      this.server.to(socketId).emit(BATTLE_EVENT, {
        type: 'SERVER_STATUS',
        status: 'unavailable',
      } satisfies ServerBattleEvent);
    }
  }

  unregisterSocket(socketId: string, userId: string): void {
    this.socketToUser.delete(socketId);
    this.userToSocket.delete(userId);
  }

  subscribeUser(userId: string): void {
    if (this.subscriberClient) {
      void this.subscriberClient.subscribe(
        RedisKeys.channels.userBattleEvent(userId)
      );
    }
  }

  unsubscribeUser(userId: string): void {
    if (this.subscriberClient) {
      void this.subscriberClient.unsubscribe(
        RedisKeys.channels.userBattleEvent(userId)
      );
    }
  }

  subscribeBattle(battleId: string): void {
    if (this.subscriberClient) {
      void this.subscriberClient.subscribe(
        RedisKeys.channels.battleUpdate(battleId)
      );
    }
  }

  emitToUser(userId: string, event: ServerBattleEvent): void {
    const socketId = this.userToSocket.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(BATTLE_EVENT, event);
    } else {
      void this.redis.publishUserBattleEvent(userId, event);
    }
  }

  getSocketId(userId: string): string | undefined {
    return this.userToSocket.get(userId);
  }

  async destroy(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.subscriberClient) {
      try {
        await this.subscriberClient.quit();
        this.logger.log('Redis subscriber disconnected');
      } catch (error) {
        this.logger.error(`Error disconnecting Redis subscriber: ${error}`);
      }
    }
  }

  // ── Private ───────────────────────────────────────────────────────────

  private broadcastStatus(status: 'unavailable' | 'restored'): void {
    if (!this.server) return;

    this.server.emit(BATTLE_EVENT, {
      type: 'SERVER_STATUS',
      status,
    } satisfies ServerBattleEvent);
  }

  private setupRedisSubscriptions(): void {
    this.subscriberClient.on('ready', () => {
      this.logger.log('Redis subscriber connected and ready');
      if (this.redisDown) {
        this.redisDown = false;
        this.broadcastStatus('restored');
      }
    });

    this.subscriberClient.on('error', (err: Error) => {
      this.logger.error(`Redis subscriber error: ${err.message}`);
      if (!this.redisDown) {
        this.redisDown = true;
        this.broadcastStatus('unavailable');
      }
    });

    this.subscriberClient.on('end', () => {
      this.logger.warn('Redis subscriber connection closed');
      if (!this.redisDown) {
        this.redisDown = true;
        this.broadcastStatus('unavailable');
      }
    });

    this.subscriberClient.on('reconnecting', (delay: number) => {
      this.logger.log(`Redis subscriber reconnecting in ${delay}ms`);
    });

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
        this.logger.debug(
          `Sending battle event — battle ${battleId}, event: ${message.data.event}, target: ${message.targetUserId}`
        );
        this.handleBattleEvent(battleId, message.targetUserId, message.data);
        break;

      case 'end':
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
    targetUserId: string,
    event: BattleEventPayload
  ): void {
    switch (event.event) {
      case 'opponent_disconnected':
        this.logger.log(`Sending OPPONENT_DISCONNECTED — battle ${battleId}`);
        this.emitToUser(targetUserId, {
          type: 'OPPONENT_DISCONNECTED',
          battleId,
          timeout: 120,
        });
        break;

      case 'opponent_reconnected':
        this.logger.log(`Sending OPPONENT_RECONNECTED — battle ${battleId}`);
        this.emitToUser(targetUserId, {
          type: 'OPPONENT_RECONNECTED',
          battleId,
        });
        break;

      case 'turn_warning':
        this.logger.log(
          `Sending TURN_WARNING — battle ${battleId}, ${event.secondsRemaining}s remaining`
        );
        this.emitToUser(targetUserId, {
          type: 'TURN_WARNING',
          battleId,
          secondsRemaining: event.secondsRemaining,
        });
        break;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      void this.redis.refreshHeartbeat();
    }, 5000);

    void this.redis.refreshHeartbeat();
    this.logger.log('Server heartbeat started');
  }
}

export const BattleSocketBridgeServiceProvider: Provider = {
  provide: BATTLE_SOCKET_BRIDGE_SERVICE,
  useClass: BattleSocketBridgeService,
};
