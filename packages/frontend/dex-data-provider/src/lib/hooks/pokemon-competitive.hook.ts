import { getPokemonCompetitive } from '../api/pokemon-dex.api';
import type { GenerationNum } from '@pkmn/dex';
import type { BattleTier } from '@pokehub/frontend/pokemon-types';
import { useQuery } from '@tanstack/react-query';

export interface PokemonByCompetiveFilter {
  generation: GenerationNum;
  tier: BattleTier<'Singles' | 'Doubles'>;
}

export const useGetPokemonByCompetiveFilter = ({
  generation,
  tier,
}: PokemonByCompetiveFilter) => {
  return useQuery({
    queryKey: ['pokedex-competetive-search', generation, tier],
    queryFn: () => {
      return getPokemonCompetitive(generation, tier);
    },
  });
};
