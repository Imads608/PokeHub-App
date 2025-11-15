import { getPokemonCompetitive } from '../api/pokemon-dex.api';
import type { GenerationNum, Tier } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface PokemonByCompetiveFilter {
  generation: GenerationNum;
  tier: Tier.Singles | Tier.Doubles;
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
