import type { PokemonDexDetails } from './pokemon-dex-details.context.model';
import type { Species } from '@pkmn/dex';
import { createContext, useContext } from 'react';

export const PokemonDexDetailsContext = createContext<
  PokemonDexDetails<'ReadWrite'>
>({
  species: {
    value: {} as Species,
    setValue: () => {
      // Function needs to be set
    },
  },
  selectedForm: {
    pokemon: {
      value: {} as Species,
      setValue: () => {
        // Function needs to be set
      },
    },
    pokemonPokeAPI: {
      value: undefined,
      setValue: () => {
        // Function needs to be set
      },
    },
    index: {
      value: undefined,
      setValue: () => {
        // Function needs to be set
      },
    },
  },
  selectedGeneration: {
    value: 9,
    setValue: () => {
      // Function needs to be set
    },
  },
});

export const usePokemonDexDetailsContext = () => {
  return useContext(PokemonDexDetailsContext);
};
