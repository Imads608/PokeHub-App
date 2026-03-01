import {
  MATCHMAKING_SERVICE,
  type IMatchmakingService,
  type MatchResult,
} from './matchmaking.service.interface';
import type { Provider } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import {
  REDIS_SERVICE,
  type RedisService,
} from '@pokehub/backend/pokehub-redis';
import { AppLogger } from '@pokehub/backend/shared-logger';

/**
 * MVP Matchmaking Service
 *
 * Simple FIFO queue-based matchmaking.
 * Players are matched in the order they joined.
 *
 * @see docs/plans/rating-matchmaking-system.md for Phase 2+ evolution
 */
@Injectable()
class MatchmakingService implements IMatchmakingService {
  constructor(
    private readonly logger: AppLogger,
    @Inject(REDIS_SERVICE) private readonly redis: RedisService
  ) {
    this.logger.setContext(MatchmakingService.name);
  }

  /**
   * Add a player to the matchmaking queue
   * @returns Queue position (1-indexed)
   */
  async joinQueue(
    userId: string,
    format: string,
    teamId: string,
    packedTeam: string
  ): Promise<number> {
    // Check if already in queue
    const existingFormat = await this.redis.getUserQueueStatus(userId);
    if (existingFormat) {
      this.logger.warn(
        `User ${userId} already in queue for ${existingFormat}, removing first`
      );
      await this.leaveQueue(userId);
    }

    // Check if already in a battle
    const existingBattle = await this.redis.getUserBattle(userId);
    if (existingBattle) {
      this.logger.warn(
        `User ${userId} already in battle ${existingBattle}, cannot join queue`
      );
      throw new Error('Already in a battle');
    }

    // Join the queue
    const position = await this.redis.joinQueue(format, {
      userId,
      teamId,
      packedTeam,
      joinedAt: Date.now(),
    });

    // Track the user's queue status
    await this.redis.setUserQueueStatus(userId, format);

    this.logger.log(
      `User ${userId} joined ${format} queue at position ${position}`
    );

    return position;
  }

  /**
   * Remove a player from the matchmaking queue
   *
   * Note: This removes the user's queue status tracking, but doesn't remove
   * them from the actual list (which would be O(n)). When we pop entries
   * from the queue in findMatch(), we skip any entries whose user has
   * left (by checking their queue status).
   */
  async leaveQueue(userId: string): Promise<void> {
    const format = await this.redis.getUserQueueStatus(userId);
    if (!format) {
      this.logger.debug(`User ${userId} not in any queue`);
      return;
    }

    await this.redis.clearUserQueueStatus(userId);
    this.logger.log(`User ${userId} left ${format} queue`);
  }

  /**
   * Check if a player is in the queue
   */
  async isInQueue(userId: string): Promise<boolean> {
    const format = await this.redis.getUserQueueStatus(userId);
    return format !== null;
  }

  /**
   * Try to find a match for a format
   *
   * MVP: Simple FIFO - pops 2 players from the queue tail
   *
   * @returns Matched players or null if not enough players
   */
  async findMatch(format: string): Promise<MatchResult | null> {
    // Try to get 2 entries from the queue
    const entries = await this.redis.popQueueEntries(format, 2);

    if (!entries || entries.length < 2) {
      return null;
    }

    const [entry1, entry2] = entries;

    // Prevent matching a user with themselves (can happen with stale queue entries)
    if (entry1.userId === entry2.userId) {
      this.logger.warn(
        `Rejecting self-match for user ${entry1.userId} - putting one entry back`
      );
      // Put back one entry and discard the stale duplicate
      await this.redis.joinQueue(format, entry2);
      return null;
    }

    // Verify both players are still in queue (haven't left)
    const [status1, status2] = await Promise.all([
      this.redis.getUserQueueStatus(entry1.userId),
      this.redis.getUserQueueStatus(entry2.userId),
    ]);

    // If either player left, put back valid entries and return null
    if (status1 !== format || status2 !== format) {
      this.logger.debug(
        `Match cancelled: player left queue (p1: ${status1}, p2: ${status2})`
      );

      // Put back any player still in queue
      if (status1 === format) {
        await this.redis.joinQueue(format, entry1);
      }
      if (status2 === format) {
        await this.redis.joinQueue(format, entry2);
      }

      return null;
    }

    // Clear both players' queue status
    await Promise.all([
      this.redis.clearUserQueueStatus(entry1.userId),
      this.redis.clearUserQueueStatus(entry2.userId),
    ]);

    this.logger.log(
      `Match found: ${entry1.userId} vs ${entry2.userId} in ${format}`
    );

    return {
      player1: {
        userId: entry1.userId,
        teamId: entry1.teamId,
        packedTeam: entry1.packedTeam,
        rating: entry1.rating,
        rd: entry1.rd,
      },
      player2: {
        userId: entry2.userId,
        teamId: entry2.teamId,
        packedTeam: entry2.packedTeam,
        rating: entry2.rating,
        rd: entry2.rd,
      },
    };
  }

  /**
   * Get the number of players queued per format.
   * Performs lazy cleanup of formats that have 0 players.
   */
  async getQueueCounts(): Promise<Record<string, number>> {
    const formats = await this.redis.getActiveFormats();
    const counts: Record<string, number> = {};

    await Promise.all(
      formats.map(async (format) => {
        const length = await this.redis.getQueueLength(format);
        if (length > 0) {
          counts[format] = length;
        } else {
          // Lazy cleanup: remove format from active set
          await this.redis.removeActiveFormat(format);
        }
      })
    );

    return counts;
  }
}

export const MatchmakingServiceProvider: Provider = {
  provide: MATCHMAKING_SERVICE,
  useClass: MatchmakingService,
};
