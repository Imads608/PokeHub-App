import type { EvoChain } from '../models/evo-chain.model';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Chain, ChainEvolvesTo, Pokemon } from 'pokeapi-js-wrapper';
import { Pokedex, type PokemonSpecies } from 'pokeapi-js-wrapper';

export const usePokeAPIEvolutionLine = (pokemon?: PokemonSpecies) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [
      'pokedex-search',
      pokemon?.name,
      { type: 'Evolutions', provider: 'PokeAPI' },
    ],
    queryFn: async () => {
      pokemon = pokemon as PokemonSpecies;

      const pokedex = new Pokedex();

      const parsedURL = new URL(pokemon.evolution_chain.url);
      const segments = parsedURL.pathname.split('/').filter(Boolean);
      const id = segments.pop();
      if (!id) {
        return;
      }

      const dexIdToPokemon: {
        [num: number]: {
          pokemonCore: Pokemon;
          pokemonSpecies: PokemonSpecies;
        }[];
      } = {};

      const transformChain = async (evoNode: Chain | ChainEvolvesTo) => {
        const pokemonCore = await pokedex.getPokemonByName(
          evoNode.species.name
        );
        const pokemonSpecies =
          pokemonCore.name === pokemon?.name
            ? pokemon
            : await pokedex.getPokemonSpeciesByName(pokemonCore.name);

        if (!dexIdToPokemon[pokemonCore.order]) {
          dexIdToPokemon[pokemonCore.order] = [];
        }
        dexIdToPokemon[pokemonCore.order].push({ pokemonCore, pokemonSpecies });
        const evo: EvoChain<{
          pokemonCore: Pokemon;
          pokemonSpecies: PokemonSpecies;
        }> = { evos: [], pokemon: { pokemonCore, pokemonSpecies } };

        evo.evos = await Promise.all(
          evoNode.evolves_to.map(
            async (node: ChainEvolvesTo) => await transformChain(node)
          )
        );
        return evo;
      };

      const evoChain = await pokedex.getEvolutionChainById(parseInt(id));
      const evoResolvedChain = await transformChain(evoChain.chain);

      const traverseChain = (
        evoNode: EvoChain<{
          pokemonCore: Pokemon;
          pokemonSpecies: PokemonSpecies;
        }>
      ) => {
        queryClient.setQueryData(
          [
            'pokedex-search',
            evoNode.pokemon.pokemonSpecies.name,
            { type: 'Evolutions', provider: 'PokeAPI' },
          ],
          { chain: evoResolvedChain, dexIdToPokemon }
        );

        queryClient.setQueryData(
          [
            'pokedex-search',
            evoNode.pokemon.pokemonCore.name,
            { type: 'Core', provider: 'PokeAPI' },
          ],
          evoNode.pokemon.pokemonCore
        );
        queryClient.setQueryData(
          [
            'pokedex-search',
            evoNode.pokemon.pokemonSpecies.name,
            { type: 'Species', provider: 'PokeAPI' },
          ],
          evoNode.pokemon.pokemonCore
        );

        const { evos } = evoNode;
        if (evos.length > 0) {
          evos.forEach((evo) => {
            traverseChain(evo);
          });
        }
      };
      traverseChain(evoResolvedChain);

      return { chain: evoResolvedChain, dexIdToPokemon };
    },
  });
};
