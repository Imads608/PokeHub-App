import type { ModdedDex } from '@pkmn/dex';
import { Dex, type GenerationNum, type ID } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface PokemonDexDetailsOptions {
  generation?: GenerationNum;
}

export const getQueryKey = (
  id?: ID,
  options: PokemonDexDetailsOptions = { generation: 9 }
) => {
  return [
    'pokedex-search',
    id,
    { provider: 'PkmnDex', type: 'CoreAndBase', ...options },
  ];
};

export const usePokemonDexDetails = (
  id?: ID,
  options: PokemonDexDetailsOptions = { generation: 9 }
) => {
  return useQuery({
    queryKey: getQueryKey(id, options),
    queryFn: () => {
      const { generation } = options;
      let moddedDex: ModdedDex;

      if (generation) {
        moddedDex = Dex.forGen(generation);
      } else {
        moddedDex = Dex;
      }

      const species = moddedDex.species.getByID(id as ID);
      if (!species.exists) {
        return undefined;
      }
      const baseSpecies = moddedDex.species.get(species.baseSpecies);
      return {
        pokemon: species,
        baseSpecies,
      };
    },
    enabled: !!id,
  });
};
