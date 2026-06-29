import type { BattleConfig } from '@pokehub/shared/pokemon-battle-types';

export const BATTLE_MANAGER_SERVICE = 'BATTLE_MANAGER_SERVICE';

export interface ActiveBattle {
  id: string;
  config: BattleConfig;
  /** Omniscient battle state (for internal use / replay) */
  currentState: string;
  /** Player 1 perspective (opponent info redacted) */
  p1State: string;
  /** Player 2 perspective (opponent info redacted) */
  p2State: string;
}

export interface IBattleManagerService {
  /**
   * Create and start a new battle
   */
  createBattle(config: BattleConfig): Promise<ActiveBattle>;

  /**
   * Process a player's choice (move or switch)
   */
  processChoice(
    battleId: string,
    playerId: string,
    choice: string
  ): Promise<void>;

  /**
   * Cancel a player's pending choice (undo before the turn executes)
   */
  cancelChoice(battleId: string, playerId: string): Promise<void>;

  /**
   * Forfeit a battle
   */
  forfeit(battleId: string, playerId: string): Promise<void>;

  /**
   * Recover a battle from Redis (after server crash)
   */
  recoverBattle(battleId: string): Promise<ActiveBattle>;

  /**
   * Get an active battle by ID (from local memory)
   */
  getBattle(battleId: string): ActiveBattle | undefined;

  /**
   * Check if a battle is hosted on this server
   */
  isHostedLocally(battleId: string): boolean;

  /**
   * Handle player disconnect
   */
  handleDisconnect(battleId: string, playerId: string): Promise<void>;

  /**
   * Handle player reconnect
   */
  handleReconnect(battleId: string, playerId: string): Promise<ActiveBattle>;

  /**
   * Cancel a battle before it really starts (e.g., opponent declined match).
   * Cleans up all battle state without declaring a winner.
   */
  cancelBattle(battleId: string): Promise<void>;
}
