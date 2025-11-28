import { getModdedDex } from '../../utils';
import type { AbilityName, GenerationNum, Species } from '@pkmn/dex';

export function getPokemonAbilitiesDetailsFromSpecies(
  species: Species,
  generation?: GenerationNum
) {
  const abilities = [
    species.abilities[0],
    species.abilities[1],
    species.abilities.S,
    species.abilities.H,
  ].filter((ability) => typeof ability === 'string');

  return getPokemonAbilitiesDetails(abilities, generation);
}

export function getPokemonAbilitiesDetails(
  abilities: string[],
  generation?: GenerationNum
) {
  const moddedDex = getModdedDex(generation);

  const abilitiesDetails = abilities.map((ability) => {
    const abilityData = moddedDex.abilities.get(ability);
    if (!abilityData.exists) {
      return undefined;
    }
    return abilityData;
  });

  return abilitiesDetails;
}

export function getAbilityDetails(
  ability: AbilityName,
  generation?: GenerationNum
) {
  const moddedDex = getModdedDex(generation);

  const abilityData = moddedDex.abilities.get(ability);
  if (!abilityData.exists) {
    return undefined;
  }
  return abilityData;
}
