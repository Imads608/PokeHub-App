import { Dex, type Species, type GenerationNum } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface PokemonEvolutionDetailsOptions {
  generation: GenerationNum;
}

// export const usePokemonEvolutionDetails = (pokemon: Species, species: PokemonSpecies, options: PokemonEvolutionDetailsOptions = { generation: 9}) => {
//   return useQuery({
// 		queryKey: ["pokedex-search", pokemon.name, { type: "tabs-details", generation: options.generation }],
//     queryFn: async () => {
// 			let gmaxPokemon: Pokemon | undefined;
//       let megaPokemon: Pokemon | undefined;
//
//       const pokedex = new Pokedex();
//       const evoLine:
//
//       species.varieties.forEach(async (variety) => {
// 				if (variety.pokemon.name.includes("gmax")) {
//           gmaxPokemon = await pokedex.getPokemonByName(variety.pokemon.name);
//         }	else if (variety.pokemon.name.includes("mega")) {
//           megaPokemon = await pokedex.getPokemonByName(variety.pokemon.name);
//         }
//       });
//
//       const moddedDex = Dex.forGen(options.generation);
//      	pokemon.pre
//
//     }
//   })
// }

export const usePokemonEvolutionLine = (
  pokemon?: Species,
  options: PokemonEvolutionDetailsOptions = { generation: 9 }
) => {
  return useQuery({
    queryKey: [
      'pokedex-search',
      pokemon?.id,
      { type: 'Evolutions', provider: 'PkmnDex', ...options },
    ],
    queryFn: () => {
      pokemon = pokemon as Species;
      const moddedDex = Dex.forGen(options.generation);
      const evoLine: Species[] = [];

      let currPokemon = pokemon;
      while (currPokemon.prevo) {
        currPokemon = moddedDex.species.get(currPokemon.prevo);
        if (currPokemon.exists && options.generation >= currPokemon.gen) {
          evoLine.unshift(currPokemon);
        }
      }
      evoLine.push(pokemon);
      pokemon.evos?.forEach((evo) => {
        const currPokemon = moddedDex.species.get(evo);
        if (currPokemon.exists && options.generation >= currPokemon.gen) {
          evoLine.push(currPokemon);
        }
      });

      return evoLine;
    },
    enabled: !!pokemon,
  });
};
