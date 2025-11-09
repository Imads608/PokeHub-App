'use client';

import type { TeamEditorContextModel } from './team-editor.context.model';
import type { AbilityName, ItemName, Species } from '@pkmn/dex';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import { createContext, useContext } from 'react';

export const TeamEditorContext = createContext<
  TeamEditorContextModel<'ReadWrite'>
>({
  teamName: {
    value: undefined,
    setValue: () => {
      // Function needs to be set
    },
  },
  format: {
    value: 'Singles',
    setValue: () => {
      // Function needs to be set
    },
  },
  tier: {
    value: 'AG',
    setValue: () => {
      // Function needs to be set
    },
  },
  generation: {
    value: 9,
    setValue: () => {
      // Function needs to be set
    },
  },
  teamPokemon: {
    value: [undefined, undefined, undefined, undefined, undefined, undefined],
    setValue: () => {
      // Function needs to be set
    },
  },
  activePokemon: {
    value: undefined,
    setValue: () => {
      // Function needs to be set
    },
  },
});

export const useTeamEditorContext = () => {
  const { activePokemon, ...restProps } = useContext(TeamEditorContext);

  const setActivePokemon = (pokemon: Partial<PokemonInTeam> | Species) => {
    if ('baseSpecies' in pokemon) {
      const species = pokemon as Species;
      activePokemon.setValue({ species: species.name });
    }
  };

  const setAbility = (ability: AbilityName) => {
    activePokemon.setValue({ ...activePokemon.value, ability });
  };

  const setItem = (item: ItemName) => {
    activePokemon.setValue({ ...activePokemon.value, item });
  };
};
