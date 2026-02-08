import {
  BATTLE_PERSISTENCE_SERVICE,
  type IBattlePersistenceService,
  type SaveReplayData,
} from './battle-persistence.service.interface';
import type { Provider } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import {
  BATTLES_DB_SERVICE,
  type IBattlesDBService,
} from '@pokehub/backend/pokehub-battles-db';
import {
  REDIS_SERVICE,
  type RedisService,
} from '@pokehub/backend/pokehub-redis';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { BattleConfig } from '@pokehub/shared/pokemon-battle-types';

/**
 * Battle Persistence Service
 *
 * Handles saving and retrieving battle replays.
 * Delegates to BattlesDBService for actual DB operations.
 */
@Injectable()
class BattlePersistenceService implements IBattlePersistenceService {
  constructor(
    private readonly logger: AppLogger,
    @Inject(BATTLES_DB_SERVICE) private readonly battlesDb: IBattlesDBService,
    @Inject(REDIS_SERVICE) private readonly redis: RedisService
  ) {
    this.logger.setContext(BattlePersistenceService.name);
  }

  /**
   * Save a replay for a user
   */
  async saveReplay(
    userId: string,
    data: SaveReplayData
  ): Promise<{ replayCount: number }> {
    this.logger.log(
      `Saving replay for battle ${data.battleId} requested by user ${userId}`
    );

    // Extract player info from config
    const config: BattleConfig = data.config;

    // Get the seed from Redis (still available if battle just ended)
    const seed = await this.redis.getBattleSeed(data.battleId);
    if (!seed) {
      this.logger.error(`Seed not found for battle ${data.battleId}`);
      throw new Error('Battle seed not found. Replay cannot be saved.');
    }

    const result = await this.battlesDb.saveReplay({
      battleId: data.battleId,
      userId,
      format: config.format,
      player1Id: config.player1.id,
      player2Id: config.player2.id,
      player1TeamId: config.player1.teamId,
      player2TeamId: config.player2.teamId,
      winnerId: data.winnerId,
      battleLog: data.battleLog,
      seed,
      playedAt: data.playedAt,
    });

    this.logger.log(
      `Replay saved for battle ${data.battleId}. User ${userId} now has ${result.replayCount} replays`
    );

    return result;
  }

  /**
   * Delete a replay
   */
  async deleteReplay(replayId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting replay ${replayId} for user ${userId}`);
    await this.battlesDb.deleteReplay(replayId, userId);
    this.logger.log(`Replay ${replayId} deleted`);
  }

  /**
   * Get user's replay count
   */
  async getUserReplayCount(userId: string): Promise<number> {
    return this.battlesDb.getUserReplayCount(userId);
  }

  /**
   * Get user's saved replays
   */
  async getSavedReplays(userId: string) {
    return this.battlesDb.getSavedReplays(userId);
  }

  /**
   * Get a specific replay
   */
  async getReplay(replayId: string) {
    return this.battlesDb.getReplay(replayId);
  }

  /**
   * Check if user can save more replays
   */
  async canSaveReplay(userId: string): Promise<boolean> {
    const count = await this.battlesDb.getUserReplayCount(userId);
    // Max 10 replays per user (enforced in BattlesDBService, but we can check preemptively)
    return count < 10;
  }
}

export const BattlePersistenceServiceProvider: Provider = {
  provide: BATTLE_PERSISTENCE_SERVICE,
  useClass: BattlePersistenceService,
};
