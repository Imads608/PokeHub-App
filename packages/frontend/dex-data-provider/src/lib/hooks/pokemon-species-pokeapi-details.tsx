import { useQuery } from '@tanstack/react-query';
import { Pokedex } from 'pokeapi-js-wrapper';

export const usePokemonSpeciesPokeAPIDetails = (name?: string) => {
  return useQuery({
    queryKey: [
      'pokemon-search',
      name,
      { type: 'Species', provider: 'PokeAPI' },
    ],
    queryFn: async () => {
      const pokedex = new Pokedex();
      const species = await pokedex.getPokemonSpeciesByName(name as string);
      return species;
    },
    enabled: !!name,
  });
};
