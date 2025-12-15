import type { GenerationNum } from '@pkmn/dex';
import { Dex } from '@pkmn/sim';

/**
 * Represents a battle format from Pokemon Showdown
 */
export interface BattleFormatInfo {
  /** Showdown format ID without gen prefix (e.g., 'ou', 'vgc2024rege') */
  id: string;
  /** Display name (e.g., 'OU', 'VGC 2024 Reg E') */
  name: string;
  /** Format description */
  description?: string;
  /** Category for organization */
  category: FormatCategory;
  /** Generation number */
  generation: GenerationNum;
}

/**
 * Format categories for organization and filtering
 */
export type FormatCategory =
  | 'Singles'
  | 'Doubles'
  | 'VGC'
  | 'Monotype'
  | 'National Dex'
  | 'Other';

/**
 * Categorizes a format based on its ID
 */
function categorizeFormat(formatId: string): FormatCategory {
  const id = formatId.toLowerCase();

  // National Dex formats (highest priority since they can be combined with others)
  if (id.includes('nationaldex')) {
    return 'National Dex';
  }

  // VGC formats
  if (id.includes('vgc') || id.includes('battlestadium')) {
    return 'VGC';
  }

  // Monotype formats
  if (id.includes('monotype')) {
    return 'Monotype';
  }

  // Doubles formats (must check before Singles)
  if (id.includes('doubles')) {
    return 'Doubles';
  }

  // Singles tier formats - match standard tier patterns
  // Check if the format ends with a known singles tier name
  const singlesTiers = [
    'ou',
    'uu',
    'ru',
    'nu',
    'pu',
    'zu',
    'lc',
    'ubers',
    'anythinggoes',
    'ag',
    'nfe',
    'uubl',
    'rubl',
    'nubl',
    'publ',
  ];
  for (const tier of singlesTiers) {
    if (id.endsWith(tier)) {
      return 'Singles';
    }
  }

  // Everything else goes to Other (1v1, 2v2, custom formats, etc.)
  return 'Other';
}

/**
 * Determines if a format should be shown in team builder
 * Filters out random battles, challenges, and other non-team-building formats
 */
function isTeamBuildingFormat(formatId: string, formatName: string): boolean {
  const id = formatId.toLowerCase();
  const name = formatName.toLowerCase();

  // Exclude random battles
  if (id.includes('random') || name.includes('random')) {
    return false;
  }

  // Exclude challenges and custom games
  if (
    id.includes('challenge') ||
    id.includes('custom') ||
    name.includes('challenge')
  ) {
    return false;
  }

  // Exclude hackmons and other experimental formats
  if (
    id.includes('hackmons') ||
    id.includes('bh') ||
    id.includes('balancedhackmons')
  ) {
    return false;
  }

  // Exclude CAP (Create-A-Pokemon) for now
  if (id.includes('cap')) {
    return false;
  }

  // Exclude metronome battles and other gimmick formats
  if (
    id.includes('metronome') ||
    id.includes('camomons') ||
    id.includes('godlygift') ||
    id.includes('stabmons')
  ) {
    return false;
  }

  // Exclude LGPE (Let's Go) formats for now
  if (id.includes('letsgo')) {
    return false;
  }

  return true;
}

/**
 * Gets all team-building formats for a specific generation
 *
 * @param generation - Pokemon generation (1-9)
 * @returns Array of battle format info objects
 *
 * @example
 * ```ts
 * const gen9Formats = getFormatsForGeneration(9);
 * // Returns formats like OU, UU, VGC 2024, Monotype, etc.
 * ```
 */
export function getFormatsForGeneration(
  generation: GenerationNum
): BattleFormatInfo[] {
  const genPrefix = `gen${generation}`;
  const formats: BattleFormatInfo[] = [];

  // Get all formats from @pkmn/sim
  const allFormats = Dex.formats.all();

  for (const format of allFormats) {
    // Only include formats for the specified generation
    if (!format.id.startsWith(genPrefix)) {
      continue;
    }

    // Filter out non-team-building formats
    if (!isTeamBuildingFormat(format.id, format.name)) {
      continue;
    }

    // Extract the format suffix (remove gen prefix)
    const formatSuffix = format.id.substring(genPrefix.length);

    formats.push({
      id: formatSuffix,
      name: format.name,
      description: format.desc,
      category: categorizeFormat(format.id),
      generation,
    });
  }

  // Sort by category and then by name
  formats.sort((a, b) => {
    // Primary sort: category
    const categoryOrder: Record<FormatCategory, number> = {
      Singles: 1,
      Doubles: 2,
      VGC: 3,
      'National Dex': 4,
      Monotype: 5,
      Other: 6,
    };

    const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    // Secondary sort: name
    return a.name.localeCompare(b.name);
  });

  return formats;
}

/**
 * Groups formats by category
 *
 * @param formats - Array of format info objects
 * @returns Object mapping category to array of formats
 *
 * @example
 * ```ts
 * const formats = getFormatsForGeneration(9);
 * const grouped = groupFormatsByCategory(formats);
 * // grouped['Singles'] contains all Singles formats
 * // grouped['VGC'] contains all VGC formats
 * ```
 */
export function groupFormatsByCategory(
  formats: BattleFormatInfo[]
): Record<FormatCategory, BattleFormatInfo[]> {
  const grouped: Record<FormatCategory, BattleFormatInfo[]> = {
    Singles: [],
    Doubles: [],
    VGC: [],
    Monotype: [],
    'National Dex': [],
    Other: [],
  };

  for (const format of formats) {
    grouped[format.category].push(format);
  }

  return grouped;
}

/**
 * Searches formats by name or ID
 *
 * @param formats - Array of formats to search
 * @param query - Search query
 * @returns Filtered array of formats matching the query
 *
 * @example
 * ```ts
 * const formats = getFormatsForGeneration(9);
 * const results = searchFormats(formats, 'vgc');
 * // Returns all VGC formats
 * ```
 */
export function searchFormats(
  formats: BattleFormatInfo[],
  query: string
): BattleFormatInfo[] {
  if (!query.trim()) {
    return formats;
  }

  const lowerQuery = query.toLowerCase();

  return formats.filter(
    (format) =>
      format.name.toLowerCase().includes(lowerQuery) ||
      format.id.toLowerCase().includes(lowerQuery) ||
      format.category.toLowerCase().includes(lowerQuery) ||
      (format.description &&
        format.description.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Gets the display label for a format category
 */
export function getCategoryLabel(category: FormatCategory): string {
  return category;
}

/**
 * Gets the full Showdown format ID from generation and format suffix
 *
 * @param generation - Pokemon generation
 * @param formatId - Format ID (without gen prefix, e.g., 'ou', 'vgc2024rege')
 * @returns Full Showdown format ID (e.g., 'gen9ou', 'gen9vgc2024rege')
 *
 * @example
 * ```ts
 * getShowdownFormatId(9, 'ou') // 'gen9ou'
 * getShowdownFormatId(9, 'vgc2024rege') // 'gen9vgc2024rege'
 * ```
 */
export function getShowdownFormatId(
  generation: GenerationNum,
  formatId: string
): string {
  return `gen${generation}${formatId}`;
}
