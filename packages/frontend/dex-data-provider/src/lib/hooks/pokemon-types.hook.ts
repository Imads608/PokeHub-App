import { getAllPokemonTypes } from '../api/pokemon-types.api';
import { useQuery } from '@tanstack/react-query';

export const POKEMON_TYPES_QUERY_KEY = ['pokemon', 'types'];

export function usePokemonTypes() {
  return useQuery({
    queryKey: POKEMON_TYPES_QUERY_KEY,
    queryFn: () => {
      return getAllPokemonTypes();
    },
    staleTime: Infinity,
  });
}
