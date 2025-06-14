import type { GenerationNum, ID, Learnset, Move } from '@pkmn/dex';
import { Dex } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface PokemonMovesFromLearnsetOptions {
  generation?: GenerationNum;
}

export const usePokemonMovesFromLearnset = (
  pokemonId: string,
  learnset?: Learnset,
  options?: PokemonMovesFromLearnsetOptions
) => {
  return useQuery({
    queryKey: [
      'pokedex-search',
      pokemonId,
      { type: 'Moves', provider: 'PkmnDex', ...options },
    ],
    queryFn: async () => {
      learnset = learnset as Learnset;
      const moddedDex = options?.generation
        ? Dex.forGen(options.generation)
        : Dex;
      const moves: { [moveId: string]: Move } = {};
      if (!learnset.learnset) {
        return moves;
      }
      const moveKeys = Object.keys(learnset.learnset);
      moveKeys.forEach((moveKey) => {
        const move = moddedDex.moves.getByID(moveKey as ID);
        if (move.exists) {
          moves[move.id] = move;
        }
      });
      return moves;
    },
    enabled: !!learnset,
  });
};
