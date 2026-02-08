import type { Provider } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { POSTGRES_SERVICE, PostgresService } from '@pokehub/backend/pokehub-postgres';
import { ServiceError } from '@pokehub/backend/shared-exceptions';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AppLogger } from '@pokehub/backend/shared-logger';
import { and, count, desc, eq } from 'drizzle-orm';
import type { BattleReplay, NewBattleReplay } from './schema/battle.schema';
import { battleReplays } from './schema/battle.schema';
import {
  BATTLES_DB_SERVICE,
  type IBattlesDBService,
} from './battles-db-service.interface';

const MAX_REPLAYS_PER_USER = 10;

@Injectable()
class BattlesDBService implements IBattlesDBService {
  constructor(
    private readonly logger: AppLogger,
    @Inject(POSTGRES_SERVICE) private readonly db: PostgresService
  ) {
    this.logger.setContext(BattlesDBService.name);
  }

  async saveReplay(replay: NewBattleReplay): Promise<{ replayCount: number }> {
    this.logger.log(`Saving replay for battle ${replay.battleId} by user ${replay.userId}`);

    // Check replay count first
    const currentCount = await this.getUserReplayCount(replay.userId);
    if (currentCount >= MAX_REPLAYS_PER_USER) {
      this.logger.warn(`User ${replay.userId} has reached max replays (${MAX_REPLAYS_PER_USER})`);
      throw new ServiceError('BadRequest', 'Maximum replay limit reached. Delete a replay to save new ones.');
    }

    // Check if user already saved this battle
    const existing = await this.getReplayByBattleId(replay.battleId, replay.userId);
    if (existing) {
      this.logger.warn(`User ${replay.userId} already saved replay for battle ${replay.battleId}`);
      throw new ServiceError('BadRequest', 'Replay already saved for this battle');
    }

    const [result] = await this.db.insert(battleReplays).values(replay).returning();

    if (!result) {
      this.logger.error('Failed to save replay');
      throw new ServiceError('ServiceError', 'Failed to save replay');
    }

    const newCount = currentCount + 1;
    this.logger.log(`Replay saved. User ${replay.userId} now has ${newCount} replays`);

    return { replayCount: newCount };
  }

  async deleteReplay(replayId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting replay ${replayId} for user ${userId}`);

    const [result] = await this.db
      .delete(battleReplays)
      .where(and(eq(battleReplays.id, replayId), eq(battleReplays.userId, userId)))
      .returning();

    if (!result) {
      this.logger.error(`Replay ${replayId} not found or not owned by user ${userId}`);
      throw new ServiceError('ServiceError', 'Replay not found');
    }

    this.logger.log(`Replay ${replayId} deleted`);
  }

  async getUserReplayCount(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(battleReplays)
      .where(eq(battleReplays.userId, userId));

    return result?.count ?? 0;
  }

  async getSavedReplays(userId: string): Promise<BattleReplay[]> {
    return this.db
      .select()
      .from(battleReplays)
      .where(eq(battleReplays.userId, userId))
      .orderBy(desc(battleReplays.savedAt));
  }

  async getReplay(replayId: string): Promise<BattleReplay | undefined> {
    const [result] = await this.db
      .select()
      .from(battleReplays)
      .where(eq(battleReplays.id, replayId))
      .limit(1);

    return result;
  }

  async getReplayByBattleId(
    battleId: string,
    userId: string
  ): Promise<BattleReplay | undefined> {
    const [result] = await this.db
      .select()
      .from(battleReplays)
      .where(
        and(
          eq(battleReplays.battleId, battleId),
          eq(battleReplays.userId, userId)
        )
      )
      .limit(1);

    return result;
  }
}

export const BattlesDBProvider: Provider = {
  provide: BATTLES_DB_SERVICE,
  useClass: BattlesDBService,
};
