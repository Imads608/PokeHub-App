import { Dex, Teams } from '@pkmn/sim';
import { TeamGenerators } from '@pkmn/randoms';

// Register the random team generator factory once on import
Teams.setGeneratorFactory(TeamGenerators);

/**
 * Check if a format uses randomly generated teams (e.g., Random Battle, Random Doubles).
 *
 * @param formatId - Full Showdown format ID (e.g., 'gen9randombattle')
 * @returns true if the format generates random teams
 */
export function isRandomFormat(formatId: string): boolean {
  const format = Dex.formats.get(formatId);
  return format.exists && format.team === 'random';
}

/**
 * Generate a random team for a given format using Showdown's team generator.
 *
 * @param formatId - Full Showdown format ID (e.g., 'gen9randombattle')
 * @returns Packed team string ready for battle creation
 */
export function generateRandomTeam(formatId: string): string {
  const team = Teams.generate(formatId);
  return Teams.pack(team);
}
