import type { BattleReplay, NewBattleReplay } from './schema/battle.schema';

export const BATTLES_DB_SERVICE = 'BATTLES_DB_SERVICE';

export interface IBattlesDBService {
  /**
   * Save a replay (creates the record)
   */
  saveReplay(replay: NewBattleReplay): Promise<{ replayCount: number }>;

  /**
   * Delete a saved replay
   */
  deleteReplay(replayId: string, userId: string): Promise<void>;

  /**
   * Get count of saved replays for a user
   */
  getUserReplayCount(userId: string): Promise<number>;

  /**
   * Get saved replays for a user
   */
  getSavedReplays(userId: string): Promise<BattleReplay[]>;

  /**
   * Get a specific replay by ID
   */
  getReplay(replayId: string): Promise<BattleReplay | undefined>;

  /**
   * Get a replay by battle ID for a specific user
   */
  getReplayByBattleId(
    battleId: string,
    userId: string
  ): Promise<BattleReplay | undefined>;
}
