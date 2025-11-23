import type { GenerationNum, Tier } from '@pkmn/dex';
import type { BattleFormat } from '@pokehub/shared/pokemon-types';

/**
 * Maps our internal format system to Pokemon Showdown format IDs.
 *
 * Our system uses:
 * - Generation (1-9)
 * - BattleFormat ('Singles' | 'Doubles')
 * - Tier (e.g., 'OU', 'Uber', 'DOU', 'DUber')
 *
 * Showdown uses format IDs like:
 * - gen9ou, gen9ubers, gen9uu, gen9ru, gen9nu, gen9pu, gen9lc
 * - gen9doublesou, gen9doublesubers
 *
 * This system is designed to be easily extensible for special formats like:
 * - VGC (gen9vgc2024, gen9vgc2025)
 * - Monotype (gen9monotype)
 * - 1v1 (gen91v1)
 * - And other custom formats
 */

/**
 * Mapping of our tier IDs to Showdown format suffixes for Singles
 */
const SINGLES_TIER_TO_SHOWDOWN: Record<Tier.Singles, string> = {
  'AG': 'anythinggoes',
  'Uber': 'ubers',
  '(Uber)': 'ubers',
  'OU': 'ou',
  '(OU)': 'ou',
  'UUBL': 'uubl',
  'UU': 'uu',
  'RUBL': 'rubl',
  'RU': 'ru',
  'NUBL': 'nubl',
  'NU': 'nu',
  '(NU)': 'nu',
  'PUBL': 'publ',
  'PU': 'pu',
  '(PU)': 'pu',
  'NFE': 'nfe',
  'LC': 'lc',
};

/**
 * Mapping of our tier IDs to Showdown format suffixes for Doubles
 */
const DOUBLES_TIER_TO_SHOWDOWN: Record<Tier.Doubles, string> = {
  'DUber': 'doublesubers',
  '(DUber)': 'doublesubers',
  'DOU': 'doublesou',
  '(DOU)': 'doublesou',
  'DBL': 'doublesbl',
  'DUU': 'doublesuu',
  '(DUU)': 'doublesuu',
  'NFE': 'nfe',
  'LC': 'lc',
};

/**
 * Get the Pokemon Showdown format ID for a given generation, format, and tier
 *
 * @param generation - Pokemon generation (1-9)
 * @param format - Battle format ('Singles' or 'Doubles')
 * @param tier - Tier from @pkmn/dex (e.g., 'OU', 'Uber', 'DOU')
 * @returns Pokemon Showdown format ID (e.g., 'gen9ou', 'gen9doublesou')
 *
 * @example
 * getShowdownFormatId(9, 'Singles', 'OU') // returns 'gen9ou'
 * getShowdownFormatId(9, 'Doubles', 'DOU') // returns 'gen9doublesou'
 * getShowdownFormatId(8, 'Singles', 'Uber') // returns 'gen8ubers'
 */
export function getShowdownFormatId(
  generation: GenerationNum,
  format: BattleFormat,
  tier: Tier.Singles | Tier.Doubles
): string {
  const genPrefix = `gen${generation}`;

  if (format === 'Singles') {
    const suffix = SINGLES_TIER_TO_SHOWDOWN[tier as Tier.Singles];
    if (!suffix) {
      throw new Error(`Unknown Singles tier: ${tier}`);
    }
    return `${genPrefix}${suffix}`;
  } else {
    const suffix = DOUBLES_TIER_TO_SHOWDOWN[tier as Tier.Doubles];
    if (!suffix) {
      throw new Error(`Unknown Doubles tier: ${tier}`);
    }
    return `${genPrefix}${suffix}`;
  }
}

/**
 * Check if a format ID is valid in Pokemon Showdown
 * Note: This is a basic check. For full validation, use the validation utilities.
 *
 * @param formatId - Showdown format ID to check
 * @returns true if the format ID follows the expected pattern
 */
export function isValidShowdownFormatId(formatId: string): boolean {
  // Pattern: gen[1-9]<formatname> (only gens 1-9 are valid, format name must start with letter)
  return /^gen[1-9][a-z][a-z0-9]*$/i.test(formatId);
}

/**
 * Parse a Showdown format ID to extract generation and format name
 *
 * @param formatId - Showdown format ID (e.g., 'gen9ou', 'gen8vgc2022')
 * @returns Object with generation and format name, or null if invalid
 *
 * @example
 * parseShowdownFormatId('gen9ou') // returns { generation: 9, format: 'ou' }
 * parseShowdownFormatId('gen8vgc2022') // returns { generation: 8, format: 'vgc2022' }
 */
export function parseShowdownFormatId(formatId: string): { generation: number; format: string } | null {
  const match = formatId.match(/^gen([1-9])(.+)$/i);
  if (!match) {
    return null;
  }

  const generation = parseInt(match[1], 10);

  // Validate generation is 1-9
  if (generation < 1 || generation > 9) {
    return null;
  }

  return {
    generation,
    format: match[2].toLowerCase(),
  };
}

/**
 * EXTENSIBILITY: Special Formats
 *
 * To add support for special formats like VGC, Monotype, 1v1, etc., you can:
 *
 * 1. Extend the BattleFormat type in pokemon-types to include new formats:
 *    export type BattleFormat = 'Singles' | 'Doubles' | 'VGC' | 'Monotype' | '1v1';
 *
 * 2. Create mappings for those formats here:
 *    const VGC_FORMAT_MAPPING = {
 *      2024: 'vgc2024',
 *      2025: 'vgc2025',
 *    };
 *
 * 3. Update getShowdownFormatId to handle the new format:
 *    if (format === 'VGC') {
 *      return `${genPrefix}${VGC_FORMAT_MAPPING[year]}`;
 *    }
 *
 * 4. Or create dedicated functions for specific formats:
 *    export function getVGCFormatId(generation: GenerationNum, year: number): string {
 *      return `gen${generation}vgc${year}`;
 *    }
 *
 * Examples of formats you might want to add:
 * - VGC: gen9vgc2024, gen9vgc2025
 * - Monotype: gen9monotype
 * - 1v1: gen91v1
 * - Battle Stadium Singles: gen9battlestadiumsingles
 * - Random Battle: gen9randombattle
 */
