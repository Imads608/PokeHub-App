import type { BattleConfig } from '@pokehub/shared/pokemon-battle-types';

export const BATTLE_MANAGER_SERVICE = 'BATTLE_MANAGER_SERVICE';

export interface ActiveBattle {
  id: string;
  config: BattleConfig;
  /** Current battle state for client display */
  currentState: string;
}

export interface IBattleManagerService {
  /**
   * Create and start a new battle
   */
  createBattle(config: BattleConfig): Promise<ActiveBattle>;

  /**
   * Process a player's choice (move or switch)
   */
  processChoice(battleId: string, playerId: string, choice: string): Promise<void>;

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
}
