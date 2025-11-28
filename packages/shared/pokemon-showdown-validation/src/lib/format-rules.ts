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
  /** Complete banlist including bans inherited from parent formats in the ruleset */
  completeBanlist: string[];
  teamSize: {
    min: number;
    max: number;
  };
  level: number;
}

/**
 * Checks if a ruleset entry is a reference to a parent format
 * @param rulesetEntry - Entry from a format's ruleset array
 * @returns true if the entry references a parent format
 *
 * @example
 * isParentFormatReference('[Gen 9] OU') // true
 * isParentFormatReference('Standard') // false
 */
function isParentFormatReference(rulesetEntry: string): boolean {
  return /^\[Gen \d+\]/.test(rulesetEntry);
}

/**
 * Recursively collects all banlists from a format and its parent formats
 * @param formatId - Showdown format ID (e.g., 'gen9uu')
 * @param visited - Set of already visited format IDs to prevent cycles
 * @param maxDepth - Maximum recursion depth to prevent runaway recursion
 * @returns Flattened array of all bans from the format hierarchy
 */
function collectBanlists(
  formatId: string,
  visited?: Set<string>,
  maxDepth?: number
): string[] {
  // Initialize on first call
  if (!visited) visited = new Set();
  if (maxDepth === undefined) maxDepth = 20;

  // Safety: Prevent cycles and excessive recursion
  if (visited.has(formatId) || maxDepth <= 0) return [];

  // Fetch format - works with both "gen9uu" and "[Gen 9] UU"
  const format = Dex.formats.get(formatId);
  if (!format.exists) return [];

  visited.add(formatId);
  let result: string[] = [];

  // Step 1: Recursively collect parent bans
  if (format.ruleset) {
    for (const entry of format.ruleset) {
      if (isParentFormatReference(entry)) {
        // Recursively get parent format's bans
        const parentBans = collectBanlists(entry, visited, maxDepth - 1);
        result = result.concat(parentBans);
        break; // Only process first parent format reference
      }
    }
  }

  // Step 2: Add current format's bans
  if (format.banlist) {
    result = result.concat(format.banlist);
  }

  // Step 3: Apply unbanlists (remove items explicitly unbanned)
  if (format.unbanlist?.length) {
    const unbanSet = new Set(format.unbanlist);
    result = result.filter((ban) => !unbanSet.has(ban));
  }

  // Step 4: Deduplication (preserve order, remove duplicates)
  const seen = new Set<string>();
  return result.filter((ban) => {
    if (seen.has(ban)) return false;
    seen.add(ban);
    return true;
  });
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

    // Recursively collect all bans from parent formats
    const completeBanlist = collectBanlists(formatId);

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
      completeBanlist,
      teamSize,
      level,
    };
  } catch (error) {
    return null;
  }
}

