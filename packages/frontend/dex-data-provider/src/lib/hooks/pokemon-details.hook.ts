import { getPokemonDetails } from '../api/pokemon-dex.api';
import { type GenerationNum, type ID } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface PokemonDetailsOptions {
  generation?: GenerationNum;
}

export const getQueryKey = (
  id?: ID,
  options: PokemonDetailsOptions = { generation: 9 }
) => {
  return [
    'pokedex-search',
    id,
    { provider: 'PkmnDex', type: 'Core', ...options },
  ];
};

export const usePokemonDetails = (
  id?: ID,
  options: PokemonDetailsOptions = { generation: 9 }
) => {
  return useQuery({
    queryKey: getQueryKey(id, options),
    queryFn: () => getPokemonDetails(id as ID, options.generation),
    enabled: !!id,
  });
};
