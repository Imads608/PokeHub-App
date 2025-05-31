import { Dex, type ID, type ModdedDex } from '@pkmn/dex';

export function getAllPokemonTypes() {
  return Dex.types.all();
}

export function getPokemonDetails(id: ID, generation?: number) {
  let moddedDex: ModdedDex;

  if (generation) {
    moddedDex = Dex.forGen(generation);
  } else {
    moddedDex = Dex;
  }

  const species = moddedDex.species.getByID(id);
  return species.exists ? species : undefined;
}
