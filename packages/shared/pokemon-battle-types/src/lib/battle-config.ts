import { PRNG } from '@pkmn/sim';

/**
 * Player information for a battle
 */
export interface BattlePlayer {
  id: string;
  name: string;
  teamId: string;
  /**
   * Packed team string in Showdown format.
   * Required for battle creation and deterministic replay.
   * Generated using Teams.pack() from @pkmn/sim.
   */
  packedTeam: string;
}

/**
 * Configuration for creating a new battle.
 * Format is the full Showdown format ID (e.g., 'gen9ou').
 */
export interface BattleConfig {
  id: string;
  /** Full Showdown format ID (e.g., 'gen9ou', 'gen9vgc2024rege') */
  format: string;
  player1: BattlePlayer;
  player2: BattlePlayer;
  /** PRNG seed for deterministic replay (PRNGSeed format) */
  seed: string;
}

/**
 * Generate a new PRNG seed for battle creation.
 * Uses @pkmn/sim's PRNG.generateSeed() for proper format.
 *
 * @returns A seed string in PRNGSeed format (e.g., "sodium,base64data")
 */
export function generateBattleSeed(): string {
  return PRNG.generateSeed();
}
