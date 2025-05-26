import type { Chain, ChainEvolvesTo, Pokemon } from 'pokeapi-js-wrapper';

export interface EvoChain<T> {
  pokemon: T;
  evos: EvoChain<T>[];
}

export type PokeApiEvolvesToChain = Omit<ChainEvolvesTo, 'species'> & {
  species: Pokemon;
};
export type PokeApiChain = Omit<Chain, 'species'> & { species: Pokemon };
