import { getPokemonAbilitiesDetails } from '../api/abilities.api';
import type { GenerationNum } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface AbilitiesDetailsOptions {
  generation?: GenerationNum;
}

export const useAbiltiesDetails = (
  abilities: string[],
  options: AbilitiesDetailsOptions = { generation: 9 }
) => {
  return useQuery({
    queryKey: [
      'pokedex-search',
      abilities,
      { type: 'Abilities', provider: 'PkmnDex', ...options },
    ],
    queryFn: () => getPokemonAbilitiesDetails(abilities, options.generation),
    enabled: abilities.length > 0,
  });
};
