import { getModdedDex } from '../../utils';
import { getStatName } from './stats.api';
import type { GenerationNum, NatureName } from '@pkmn/dex';

export function getNatureDetails(
  nature: NatureName,
  generation?: GenerationNum
) {
  const moddedDex = getModdedDex(generation);
  const natureDetails = moddedDex.natures.get(nature);
  if (!natureDetails.exists) {
    return undefined;
  }
  return natureDetails;
}

export function getNatures(generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);
  const natures = moddedDex.natures.all();
  return natures;
}

export const getNatureDescription = (
  nature: NatureName,
  generation?: GenerationNum
) => {
  const natureDetails = getNatureDetails(nature, generation);
  const statIncrease = natureDetails?.plus;
  const statDecrease = natureDetails?.minus;

  if (statIncrease && statDecrease) {
    return `Increases ${getStatName(
      statIncrease
    )} while decreasing ${getStatName(statDecrease)}.`;
  }
  return 'No stat changes.';
};
