import type { GenerationNum } from '@pkmn/dex';
import { Dex } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface PokemonLearnsetOptions {
  generation?: GenerationNum;
}

export const usePokemonLearnset = (
  pokemonId: string,
  options?: PokemonLearnsetOptions
) => {
  return useQuery({
    queryKey: [
      'pokedex-search',
      pokemonId,
      { type: 'Learnset', provider: 'PkmnDex', ...options },
    ],
    queryFn: async () => {
      const moddedDex = options?.generation
        ? Dex.forGen(options.generation)
        : Dex;
      const learningSet = await moddedDex.learnsets.get(pokemonId);
      if (!learningSet.exists) {
        return undefined;
      }
      return learningSet;
    },
  });
};
