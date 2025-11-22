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

/**
 * Check if a specific rule/clause is active in a format
 *
 * @param formatId - Showdown format ID
 * @param rule - Rule name (e.g., 'Species Clause', 'Sleep Clause Mod')
 * @returns true if the rule is active
 *
 * @example
 * if (isRuleActive('gen9ou', 'Species Clause')) {
 *   console.log('Cannot use duplicate Pokemon');
 * }
 */
export function isRuleActive(formatId: string, rule: string): boolean {
  const rules = getFormatRules(formatId);
  if (!rules) return false;

  return rules.rules.some(r => r.toLowerCase() === rule.toLowerCase());
}

/**
 * Get a human-readable description of common format rules
 *
 * @param rule - Rule name from Showdown
 * @returns Human-readable description
 */
export function getRuleDescription(rule: string): string {
  const descriptions: Record<string, string> = {
    'Species Clause': 'You cannot have two Pokemon with the same Pokedex number on a team.',
    'Sleep Clause Mod': 'You cannot put more than one opposing Pokemon to sleep at a time.',
    'OHKO Clause': 'One-hit KO moves (like Fissure and Horn Drill) are banned.',
    'Evasion Clause': 'Evasion-boosting moves and items are banned.',
    'Evasion Moves Clause': 'Evasion-boosting moves (like Double Team) are banned.',
    'Evasion Items Clause': 'Evasion-boosting items (like Bright Powder) are banned.',
    'Endless Battle Clause': 'Forcing an endless battle is banned.',
    'HP Percentage Mod': 'HP is shown in percentages.',
    'Cancel Mod': 'Allows players to cancel their moves before the turn executes.',
    'Team Preview': 'You will see your opponent\'s team before the battle begins.',
    'Terastal Clause': 'You may only Terastallize one Pokemon per battle.',
    'Dynamax Clause': 'You cannot Dynamax.',
  };

  return descriptions[rule] || rule;
}

/**
 * Get all active clauses for a format with descriptions
 *
 * @param formatId - Showdown format ID
 * @returns Array of clauses with descriptions
 *
 * @example
 * const clauses = getFormatClauses('gen9ou');
 * clauses.forEach(clause => {
 *   console.log(`${clause.name}: ${clause.description}`);
 * });
 */
export function getFormatClauses(formatId: string): Array<{ name: string; description: string }> {
  const rules = getFormatRules(formatId);
  if (!rules) return [];

  return rules.rules
    .filter(rule => rule.includes('Clause') || rule.includes('Mod'))
    .map(rule => ({
      name: rule,
      description: getRuleDescription(rule),
    }));
}
