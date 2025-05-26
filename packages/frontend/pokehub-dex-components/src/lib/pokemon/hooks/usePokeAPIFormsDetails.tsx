import { useQueries } from '@tanstack/react-query';
import { Pokedex } from 'pokeapi-js-wrapper';

export const usePokeAPIFormsDetails = (names: string[]) => {
  return useQueries({
    queries: names.map((name) => ({
      queryKey: ['pokedex-search', name, { type: 'Core', provider: 'PokeAPI' }],
      queryFn: async () => {
        const pokedex = new Pokedex();
        const species = await pokedex.getPokemonByName(name);
        return species;
      },
    })),
  });
};
