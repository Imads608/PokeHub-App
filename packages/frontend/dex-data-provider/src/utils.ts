import type { GenerationNum } from '@pkmn/dex';
import { Dex } from '@pkmn/dex';

export function getModdedDex(generation?: GenerationNum) {
  if (generation) {
    return Dex.forGen(generation);
  } else {
    return Dex;
  }
}
