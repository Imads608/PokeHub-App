import { useQuery } from '@tanstack/react-query';
import { Pokedex } from 'pokeapi-js-wrapper';

export const usePokemonPokeAPIDetails = (
  pokemonId: string | number | undefined
) => {
  return useQuery({
    queryKey: ['pokedex-search', pokemonId, { type: 'PokeAPI' }],
    queryFn: async () => {
      const pokedex = new Pokedex();
      const pokemon = await pokedex.getPokemonByName(
        pokemonId as string | number
      );
      return pokemon;
    },
    enabled: !!pokemonId,
  });
};
