import { getModdedDex } from '../../utils';
import type { GenerationNum, ID, Species, SpeciesName } from '@pkmn/dex';
import { isBaseForme } from '@pokehub/frontend/shared-utils';

export function getPokemonDetails(id: ID, generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);

  const species = moddedDex.species.getByID(id);
  return species.exists ? species : undefined;
}

export function getPokemonDetailsByName(
  name: SpeciesName,
  generation?: GenerationNum
) {
  const moddedDex = getModdedDex(generation);

  const species = moddedDex.species.get(name);
  return species.exists ? species : undefined;
}

export function getAllPokemonSpecies(gen: GenerationNum) {
  const moddedDex = getModdedDex(gen);
  const filteredSpecies: Species[] = [];

  moddedDex.species.all().forEach((species) => {
    if (!species.baseSpecies || isBaseForme(species)) {
      filteredSpecies.push(species);
    }
  });

  return filteredSpecies;
}
