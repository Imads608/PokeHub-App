import { Dex } from '@pkmn/dex';

export function getAllPokemonTypes() {
  return Dex.types.all();
}
