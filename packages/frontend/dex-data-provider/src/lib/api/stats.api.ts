import { getModdedDex } from '../../utils';
import type { GenerationNum, StatID } from '@pkmn/dex';

export function getStatName(statId: StatID, generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);
  return moddedDex.stats.names[statId];
}

export function getStats(generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);
  return moddedDex.stats.ids();
}
