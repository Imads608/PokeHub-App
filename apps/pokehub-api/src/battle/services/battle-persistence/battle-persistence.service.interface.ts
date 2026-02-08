import type { BattleConfig } from '@pokehub/shared/pokemon-battle-types';
import type { BattleReplay } from '@pokehub/backend/pokehub-battles-db';

export const BATTLE_PERSISTENCE_SERVICE = 'BATTLE_PERSISTENCE_SERVICE';

export interface SaveReplayData {
  battleId: string;
  config: BattleConfig;
  battleLog: string[];
  winnerId: string | null;
  playedAt: Date;
}

export interface IBattlePersistenceService {
  /**
   * Save a replay for a user
   * @returns Updated replay count for the user
   */
  saveReplay(userId: string, data: SaveReplayData): Promise<{ replayCount: number }>;

  /**
   * Delete a replay
   */
  deleteReplay(replayId: string, userId: string): Promise<void>;

  /**
   * Get user's replay count
   */
  getUserReplayCount(userId: string): Promise<number>;

  /**
   * Get user's saved replays
   */
  getSavedReplays(userId: string): Promise<BattleReplay[]>;

  /**
   * Get a specific replay
   */
  getReplay(replayId: string): Promise<BattleReplay | undefined>;

  /**
   * Check if user can save more replays
   */
  canSaveReplay(userId: string): Promise<boolean>;
}
