import { getModdedDex } from '../../utils';
import type { GenerationNum, MoveName } from '@pkmn/dex';

export function getMoveDetails(move: MoveName, generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);

  const moveDetails = moddedDex.moves.get(move);
  if (!moveDetails.exists) {
    return undefined;
  }
  return moveDetails;
}
