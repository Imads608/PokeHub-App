import { Dex } from '@pkmn/sim';

/**
 * Information about a format's rules and restrictions
 */
export interface FormatRules {
  formatId: string;
  formatName: string;
  rules: string[];
  banlist: string[];
  unbanlist: string[];
  restricted: string[];
  teamSize: {
    min: number;
    max: number;
  };
  level: number;
}

/**
 * Get detailed rules and restrictions for a given format
 *
 * @param formatId - Showdown format ID (e.g., 'gen9ou', 'gen9vgc2024')
 * @returns Format rules information, or null if format doesn't exist
 *
 * @example
 * const rules = getFormatRules('gen9ou');
 * if (rules) {
 *   console.log('Active rules:', rules.rules);
 *   console.log('Banned:', rules.banlist);
 * }
 */
export function getFormatRules(formatId: string): FormatRules | null {
  try {
    const format = Dex.formats.get(formatId);
    if (!format.exists) {
      return null;
    }

    // Extract rules from the format
    const rules = format.ruleset || [];
    const banlist = format.banlist || [];
    const unbanlist = format.unbanlist || [];
    const restricted = format.restricted || [];

    // Determine team size limits
    // Most singles formats: 6 max, most doubles/VGC: 4-6 max
    const teamSize = {
      min: 1,
      max: formatId.includes('vgc') || formatId.includes('doubles') ? 4 : 6,
    };

    // Determine level (100 for singles, 50 for VGC)
    const level = formatId.includes('vgc') ? 50 : 100;

    return {
      formatId,
      formatName: format.name,
      rules,
      banlist,
      unbanlist,
      restricted,
      teamSize,
      level,
    };
  } catch (error) {
    return null;
  }
}

