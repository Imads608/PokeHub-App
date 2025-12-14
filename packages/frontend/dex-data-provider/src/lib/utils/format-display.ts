import type { GenerationNum } from '@pkmn/dex';

/**
 * Gets a human-readable display name from generation and format suffix
 * Matches the format name style used by Pokemon Showdown (e.g., '[Gen 9] OU')
 *
 * This is a lightweight utility that doesn't import @pkmn/sim
 *
 * @param generation - Pokemon generation
 * @param formatId - Format ID (without gen prefix, e.g., 'ou', 'vgc2024rege')
 * @returns Display name (e.g., '[Gen 9] OU', '[Gen 9] VGC 2024 Reg E')
 *
 * @example
 * ```ts
 * getFormatDisplayName(9, 'ou') // '[Gen 9] OU'
 * getFormatDisplayName(9, 'vgc2024rege') // '[Gen 9] VGC 2024 Reg E'
 * ```
 */
export function getFormatDisplayName(
  generation: GenerationNum,
  formatId: string
): string {
  const formatName = formatIdToDisplayName(formatId);
  return `[Gen ${generation}] ${formatName}`;
}

/**
 * Converts a format ID suffix to a display name
 * @param formatId - Format ID without gen prefix (e.g., 'ou', 'vgc2024rege')
 * @returns Display name (e.g., 'OU', 'VGC 2024 Reg E')
 */
function formatIdToDisplayName(formatId: string): string {
  const id = formatId.toLowerCase();

  // Standard tiers - uppercase
  const standardTiers: Record<string, string> = {
    ou: 'OU',
    uu: 'UU',
    ru: 'RU',
    nu: 'NU',
    pu: 'PU',
    zu: 'ZU',
    lc: 'LC',
    ag: 'AG',
    nfe: 'NFE',
    ubers: 'Ubers',
    anythinggoes: 'Anything Goes',
    doublesou: 'Doubles OU',
    doublesuu: 'Doubles UU',
    doublesru: 'Doubles RU',
    doublesnu: 'Doubles NU',
    doublesubers: 'Doubles Ubers',
    vgc2024regh: 'VGC 2024 Reg H',
    vgc2024regg: 'VGC 2024 Reg G',
    vgc2024regf: 'VGC 2024 Reg F',
    vgc2024rege: 'VGC 2024 Reg E',
    vgc2024regd: 'VGC 2024 Reg D',
    vgc2024regc: 'VGC 2024 Reg C',
    vgc2024regb: 'VGC 2024 Reg B',
    vgc2024rega: 'VGC 2024 Reg A',
    vgc2023series2: 'VGC 2023 Series 2',
    vgc2023series1: 'VGC 2023 Series 1',
    nationaldex: 'National Dex',
    nationaldexou: 'National Dex OU',
    nationaldexuu: 'National Dex UU',
    nationaldexag: 'National Dex AG',
    nationaldexubers: 'National Dex Ubers',
    monotype: 'Monotype',
    '1v1': '1v1',
    '2v2doubles': '2v2 Doubles',
    battlestadiumsingles: 'Battle Stadium Singles',
    battlestadiumdoubles: 'Battle Stadium Doubles',
    bdspou: 'BDSP OU',
  };

  if (standardTiers[id]) {
    return standardTiers[id];
  }

  // Fallback: capitalize and add spaces before capital letters/numbers
  return formatId
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/^./, (str) => str.toUpperCase());
}
