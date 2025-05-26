import type { EvoChain } from '../models/evo-chain.model';
import type { SpeciesName } from '@pkmn/dex';
import { Dex, type Species, type GenerationNum } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';
import type { Pokemon } from 'pokeapi-js-wrapper';
import { Pokedex } from 'pokeapi-js-wrapper';

export interface PokemonEvolutionDetailsOptions {
  generation: GenerationNum;
}

export const usePokemonEvolutionLine = (
  pokemon?: Species,
  options: PokemonEvolutionDetailsOptions = { generation: 9 }
) => {
  return useQuery({
    queryKey: [
      'pokedex-search',
      pokemon?.id,
      { type: 'Evolutions', provider: ['PkmnDex', 'PokeAPI'], ...options },
    ],
    queryFn: () => {
      pokemon = pokemon as Species;
      const moddedDex = Dex.forGen(options.generation);
      const pokedex = new Pokedex();

      const transformChain = async (name: string) => {
        const species = moddedDex.species.get(name);
        const pokeAPI = await pokedex.getPokemonByName(
          species.name.toLowerCase()
        );
        const evo: EvoChain<{ pokeAPI: Pokemon; dex: Species }> = {
          evos: [],
          pokemon: { pokeAPI, dex: species },
        };

        evo.evos = await Promise.all(
          (species.evos ?? []).map(async (node: SpeciesName) =>
            transformChain(node)
          )
        );
        return evo;
      };

      let baseEvo = pokemon;

      while (baseEvo.prevo) {
        baseEvo = moddedDex.species.get(baseEvo.prevo);
      }

      const evoChain = transformChain(baseEvo.name);
      return evoChain;
    },
    enabled: !!pokemon,
  });
};
