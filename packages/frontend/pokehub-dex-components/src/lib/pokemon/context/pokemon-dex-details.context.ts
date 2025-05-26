'use client';

import type { PokemonDexDetails } from './pokemon-dex-details.context.model';
import type { Species } from '@pkmn/dex';
import { createContext, useContext } from 'react';

export const PokemonDexDetailsContext = createContext<
  PokemonDexDetails<'ReadWrite'>
>({
  id: {
    value: undefined,
    setValue: () => {
      // Function needs to be set
    },
  },
  species: {
    value: {} as Species,
    setValue: () => {
      // Function needs to be set
    },
  },
  selectedTab: {
    value: 'Stats',
    setValue: () => {
      // Function needs to be set
    },
  },
  forms: {
    value: [],
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
  const contextVals = useContext(PokemonDexDetailsContext);

  return {
    ...contextVals,
    resetOnSpeciesNav: (resetSelectedForm?: boolean) => {
      contextVals.forms.setValue([]);
      contextVals.id.setValue(undefined);
      contextVals.species.setValue(undefined);
      if (resetSelectedForm) {
        contextVals.selectedForm.pokemon.setValue(undefined);
        contextVals.selectedForm.pokemonPokeAPI.setValue(undefined);
        contextVals.selectedForm.index.setValue(undefined);
      }
    },
  };
};
