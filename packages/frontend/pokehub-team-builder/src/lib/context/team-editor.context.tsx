'use client';

import type { TeamEditorContextModel } from './team-editor.context.model';
import type {
  AbilityName,
  ItemName,
  MoveName,
  NatureName,
  Species,
} from '@pkmn/dex';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import { createContext, useCallback, useContext } from 'react';

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

  const setActivePokemon = (pokemon: PokemonInTeam | Species) => {
    if ('baseSpecies' in pokemon) {
      const species = pokemon as Species;
      activePokemon.setValue(createNewPokemonFromSpecies(species));
      return;
    } else {
      activePokemon.setValue(pokemon as PokemonInTeam);
    }
  };

  const setLevel = useCallback(
    (level: number) => {
      activePokemon.value &&
        activePokemon.setValue({ ...activePokemon.value, level });
    },
    [activePokemon]
  );

  const setAbility = useCallback(
    (ability: AbilityName) => {
      activePokemon.value &&
        activePokemon.setValue({ ...activePokemon.value, ability });
    },
    [activePokemon]
  );

  const setItem = useCallback(
    (item: ItemName) => {
      activePokemon.value &&
        activePokemon.setValue({ ...activePokemon.value, item });
    },
    [activePokemon]
  );

  const setName = useCallback(
    (name: string) => {
      activePokemon.value &&
        activePokemon.setValue({ ...activePokemon.value, name });
    },
    [activePokemon]
  );

  const setNature = useCallback(
    (nature: NatureName) => {
      activePokemon.value &&
        activePokemon.setValue({ ...activePokemon.value, nature });
    },
    [activePokemon]
  );

  const setMove = useCallback(
    (index: number, move: MoveName | '') => {
      if (!activePokemon.value) return;
      const newMoves = [...activePokemon.value.moves];
      newMoves[index] = move as MoveName;
      activePokemon.setValue({ ...activePokemon.value, moves: newMoves });
    },
    [activePokemon]
  );

  return {
    ...restProps,
    activePokemon: {
      value: activePokemon.value,
      setValue: setActivePokemon,
      setLevel,
      setItem,
      setAbility,
      setName,
      setNature,
      setMove,
    },
  };
};

const createNewPokemonFromSpecies = (species: Species): PokemonInTeam => {
  return {
    species: species.name,
    name: species.name,
    ability: species.abilities[0] as AbilityName,
    item: '' as ItemName,
    evs: {
      atk: 0,
      def: 0,
      hp: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    },
    gender: species.gender || 'N',
    ivs: {
      atk: 0,
      def: 0,
      hp: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    },
    level: 50,
    moves: ['', '', '', ''] as MoveName[],
    nature: 'Adamant',
  };
};
