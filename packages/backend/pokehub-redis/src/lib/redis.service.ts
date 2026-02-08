import { RedisKeys } from './redis.keys';
import {
  parseBattleMetadata,
  parsePendingChoices,
  parseQueueEntry,
  serializeBattleMetadata,
} from './redis.types';
import type {
  BattleMetadata,
  BattleMoveMessage,
  BattleUpdateMessage,
  MatchFoundMessage,
  PendingChoices,
  QueueEntry,
  RedisBattleMetadata,
} from './redis.types';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '@pokehub/backend/shared-logger';
import Redis from 'ioredis';
import * as os from 'os';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      HOSTNAME?: string;
    }
  }
}

export const REDIS_SERVICE = 'REDIS_SERVICE';

export interface RedisConfiguration {
  redis: {
    host: string;
    port: number;
    password: string;
    tls: boolean;
  };
}

/**
 * Typed Redis service for the battle system.
 * Wraps ioredis with domain-specific methods.
 */
export class RedisBattleService {
  private readonly serverId: string;

  constructor(
    private readonly client: Redis,
    private readonly logger: AppLogger
  ) {
    this.serverId = process.env.HOSTNAME || os.hostname();
  }

  getServerId(): string {
    return this.serverId;
  }

  getClient(): Redis {
    return this.client;
  }

  /**
   * Create a duplicate client for pub/sub subscriptions.
   * Subscriber clients cannot run other commands while subscribed.
   */
  createSubscriberClient(): Redis {
    return this.client.duplicate();
  }

  // ==================== Matchmaking Queue ====================

  async joinQueue(format: string, entry: QueueEntry): Promise<number> {
    const key = RedisKeys.matchmaking.queue(format);
    const position = await this.client.lpush(key, JSON.stringify(entry));
    this.logger.debug(
      `User ${entry.userId} joined queue for ${format} at position ${position}`
    );
    return position;
  }

  async getQueueLength(format: string): Promise<number> {
    const key = RedisKeys.matchmaking.queue(format);
    return this.client.llen(key);
  }

  async popQueueEntries(
    format: string,
    count: number
  ): Promise<QueueEntry[] | null> {
    const key = RedisKeys.matchmaking.queue(format);
    const entries = await this.client.rpop(key, count);
    if (!entries || entries.length < count) {
      // Put back any popped entries if we didn't get enough
      if (entries && entries.length > 0) {
        await this.client.rpush(key, ...entries);
        this.logger.debug(
          `Not enough players in ${format} queue, returned ${entries.length} entries`
        );
      }
      return null;
    }
    const parsed = entries.map((e) => parseQueueEntry(e));
    this.logger.debug(
      `Popped ${count} entries from ${format} queue: ${parsed
        .map((p) => p.userId)
        .join(', ')}`
    );
    return parsed;
  }

  async setUserQueueStatus(userId: string, format: string): Promise<void> {
    const key = RedisKeys.user.queueStatus(userId);
    await this.client.set(key, format);
  }

  async getUserQueueStatus(userId: string): Promise<string | null> {
    const key = RedisKeys.user.queueStatus(userId);
    return this.client.get(key);
  }

  async clearUserQueueStatus(userId: string): Promise<void> {
    const key = RedisKeys.user.queueStatus(userId);
    await this.client.del(key);
  }

  // ==================== User Battle State ====================

  async setUserBattle(userId: string, battleId: string): Promise<void> {
    const key = RedisKeys.user.currentBattle(userId);
    await this.client.set(key, battleId);
  }

  async getUserBattle(userId: string): Promise<string | null> {
    const key = RedisKeys.user.currentBattle(userId);
    return this.client.get(key);
  }

  async clearUserBattle(userId: string): Promise<void> {
    const key = RedisKeys.user.currentBattle(userId);
    await this.client.del(key);
  }

  // ==================== Battle Metadata ====================

  async createBattle(
    battleId: string,
    metadata: BattleMetadata
  ): Promise<void> {
    const key = RedisKeys.battle.metadata(battleId);
    const serialized = serializeBattleMetadata(metadata);
    await this.client.hset(key, serialized);
    this.logger.log(
      `Created battle ${battleId} on server ${metadata.hostServer}`
    );
  }

  async getBattleMetadata(battleId: string): Promise<BattleMetadata | null> {
    const key = RedisKeys.battle.metadata(battleId);
    const data = await this.client.hgetall(key);
    if (!data || Object.keys(data).length === 0) {
      this.logger.debug(`Battle metadata not found for ${battleId}`);
      return null;
    }
    const parsed = parseBattleMetadata(data);
    if (!parsed) {
      this.logger.warn(`Invalid battle metadata for ${battleId}`);
    }
    return parsed;
  }

  async updateBattleMetadata(
    battleId: string,
    updates: Partial<RedisBattleMetadata>
  ): Promise<void> {
    const key = RedisKeys.battle.metadata(battleId);
    await this.client.hset(key, updates);
    this.logger.debug(
      `Updated battle ${battleId} metadata: ${Object.keys(updates).join(', ')}`
    );
  }

  async deleteBattleMetadata(battleId: string): Promise<void> {
    const key = RedisKeys.battle.metadata(battleId);
    await this.client.del(key);
    this.logger.debug(`Deleted battle metadata for ${battleId}`);
  }

  // ==================== Battle Seed ====================

  async setBattleSeed(battleId: string, seed: string): Promise<void> {
    const key = RedisKeys.battle.seed(battleId);
    await this.client.set(key, seed);
  }

  async getBattleSeed(battleId: string): Promise<string | null> {
    const key = RedisKeys.battle.seed(battleId);
    return this.client.get(key);
  }

  // ==================== Battle Input Log ====================

  async appendBattleLog(
    battleId: string,
    ...commands: string[]
  ): Promise<void> {
    const key = RedisKeys.battle.log(battleId);
    await this.client.rpush(key, ...commands);
  }

  async getBattleLog(battleId: string): Promise<string[]> {
    const key = RedisKeys.battle.log(battleId);
    return this.client.lrange(key, 0, -1);
  }

  async setBattleLogTTL(battleId: string, seconds: number): Promise<void> {
    const key = RedisKeys.battle.log(battleId);
    await this.client.expire(key, seconds);
  }

  async deleteBattleLog(battleId: string): Promise<void> {
    const key = RedisKeys.battle.log(battleId);
    await this.client.del(key);
  }

  // ==================== Pending Choices ====================

  async setPendingChoices(
    battleId: string,
    choices: PendingChoices
  ): Promise<void> {
    await this.updateBattleMetadata(battleId, {
      pending: JSON.stringify(choices),
    });
  }

  async getPendingChoices(battleId: string): Promise<PendingChoices> {
    const metadata = await this.getBattleMetadata(battleId);
    if (!metadata?.pending) {
      return {};
    }
    return parsePendingChoices(metadata.pending);
  }

  // ==================== Server Heartbeat ====================

  async refreshHeartbeat(): Promise<void> {
    const key = RedisKeys.server.heartbeat(this.serverId);
    await this.client.set(key, Date.now().toString(), 'EX', 10);
  }

  async isServerAlive(serverId: string): Promise<boolean> {
    const key = RedisKeys.server.heartbeat(serverId);
    const heartbeat = await this.client.get(key);
    const alive = heartbeat !== null;
    if (!alive) {
      this.logger.debug(`Server ${serverId} heartbeat not found (dead)`);
    }
    return alive;
  }

  // ==================== Server Battles ====================

  async addServerBattle(battleId: string): Promise<void> {
    const key = RedisKeys.server.battles(this.serverId);
    await this.client.sadd(key, battleId);
    this.logger.debug(`Added battle ${battleId} to server ${this.serverId}`);
  }

  async removeServerBattle(battleId: string): Promise<void> {
    const key = RedisKeys.server.battles(this.serverId);
    await this.client.srem(key, battleId);
    this.logger.debug(
      `Removed battle ${battleId} from server ${this.serverId}`
    );
  }

  async getServerBattles(serverId: string): Promise<string[]> {
    const key = RedisKeys.server.battles(serverId);
    return this.client.smembers(key);
  }

  // ==================== Pub/Sub ====================

  async publishMatchFound(
    userId: string,
    message: MatchFoundMessage
  ): Promise<void> {
    const channel = RedisKeys.channels.matchFound(userId);
    await this.client.publish(channel, JSON.stringify(message));
    this.logger.debug(
      `Published match found to user ${userId}: battle ${message.battleId}`
    );
  }

  async publishBattleMove(
    battleId: string,
    message: BattleMoveMessage
  ): Promise<void> {
    const channel = RedisKeys.channels.battleMove(battleId);
    await this.client.publish(channel, JSON.stringify(message));
    this.logger.debug(
      `Published move for battle ${battleId}: ${message.player} -> ${message.choice}`
    );
  }

  async publishBattleUpdate(
    battleId: string,
    message: BattleUpdateMessage
  ): Promise<void> {
    const channel = RedisKeys.channels.battleUpdate(battleId);
    await this.client.publish(channel, JSON.stringify(message));
    this.logger.debug(
      `Published battle update for ${battleId}: ${message.type}`
    );
  }

  // ==================== Cleanup ====================

  async cleanupBattle(battleId: string): Promise<void> {
    this.logger.log(`Cleaning up battle ${battleId}`);
    await Promise.all([
      this.deleteBattleMetadata(battleId),
      this.client.del(RedisKeys.battle.seed(battleId)),
      this.deleteBattleLog(battleId),
      this.removeServerBattle(battleId),
    ]);
    this.logger.debug(`Battle ${battleId} cleanup complete`);
  }

  // ==================== Health Check ====================

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

export const redisProvider = {
  provide: REDIS_SERVICE,
  useFactory: async (
    logger: AppLogger,
    configService: ConfigService<RedisConfiguration, true>
  ): Promise<RedisBattleService> => {
    const redisConfig = configService.get('redis', { infer: true });

    const client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
      tls: redisConfig.tls ? {} : undefined,
      // Retry strategy: linear backoff, fail fast after 3 attempts
      //
      // Current: 200ms → 400ms → 600ms → stop
      // This is intentional for MVP - fail fast during startup rather than
      // hanging indefinitely if Redis is misconfigured.
      //
      // For production with many server instances, consider exponential backoff
      // with jitter to prevent "thundering herd" when Redis recovers:
      //
      //   const exponentialDelay = Math.min(100 * Math.pow(2, times - 1), 30000);
      //   const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
      //   return Math.round(exponentialDelay + jitter);
      //
      // When to upgrade:
      // - Running 10+ API server instances
      // - Seeing connection storm issues in logs after Redis restarts
      // - Need graceful degradation instead of fail-fast behavior
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error(`Redis connection failed after ${times} attempts`);
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    client.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
    });

    await client.ping();
    logger.log(
      `Connected to Redis: ${redisConfig.host}:${redisConfig.port} (TLS: ${redisConfig.tls})`
    );

    return new RedisBattleService(client, logger);
  },
  inject: [AppLogger, ConfigService],
};

export type RedisService = RedisBattleService;
