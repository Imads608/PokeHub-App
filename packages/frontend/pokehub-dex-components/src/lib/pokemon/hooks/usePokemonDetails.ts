import { Dex, type GenerationNum, type ModdedDex, type ID } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface PokemonDetailsOptions {
  generation?: GenerationNum;
}

export const usePokemonDetails = (id: ID, options?: PokemonDetailsOptions) => {
  return useQuery({
    queryKey: ['pokedex-search', id, { type: 'PkmnDex', ...options }],
    queryFn: () => {
      let moddedDex: ModdedDex;

      if (options?.generation) {
        moddedDex = Dex.forGen(options.generation);
      } else {
        moddedDex = Dex;
      }

      const species = moddedDex.species.getByID(id);
      return species.exists ? species : undefined;
    },
  });
};
