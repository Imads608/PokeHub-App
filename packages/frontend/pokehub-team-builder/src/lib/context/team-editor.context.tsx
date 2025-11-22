'use client';

import type {
  TeamEditorContextModel,
  TeamValidationState,
} from './team-editor.context.model';
import type {
  AbilityName,
  ItemName,
  MoveName,
  NatureName,
  Species,
  StatID,
} from '@pkmn/dex';
import {
  validateTeamForFormat,
  getShowdownFormatId,
} from '@pokehub/shared/pokemon-showdown-validation';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import { validateTeam } from '@pokehub/shared/pokemon-types';
import { createContext, useCallback, useContext, useMemo } from 'react';

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
    value: [],
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
  validation: {
    state: {
      isValid: true,
      errors: [],
      showdownFormatId: 'gen9anythinggoes',
      timestamp: 0,
    },
    getTeamErrors: () => [],
    getPokemonErrors: () => [],
    isTeamValid: true,
    showdownFormatId: 'gen9anythinggoes',
  },
});

export const useTeamEditorContext = () => {
  const {
    activePokemon,
    teamPokemon,
    generation,
    format,
    tier,
    teamName,
    ...restProps
  } = useContext(TeamEditorContext);

  // Compute Showdown format ID (memoized)
  const showdownFormatId = useMemo(() => {
    return getShowdownFormatId(generation.value, format.value, tier.value);
  }, [generation.value, format.value, tier.value]);

  // Run validation (memoized - only recomputes when team data changes)
  const validationState: TeamValidationState = useMemo(() => {
    // Run Zod structural validation
    const zodResult = validateTeam({
      name: teamName.value,
      generation: generation.value,
      format: format.value,
      tier: tier.value,
      pokemon: teamPokemon.value, // No undefined, no filtering needed!
    });

    // Run Showdown format validation
    const showdownResult = validateTeamForFormat(
      {
        name: teamName.value || '',
        generation: generation.value,
        format: format.value,
        tier: tier.value,
        pokemon: teamPokemon.value, // Already filtered, no undefined!
      },
      showdownFormatId
    );

    // Merge errors from both validators
    const mergedErrors = [
      ...zodResult.errors,
      ...Array.from(showdownResult.pokemonResults.entries()).flatMap(
        ([index, result]) =>
          result.errors.map((error) => ({
            field: `pokemon.${index}`,
            message: error,
            pokemonSlot: index, // Direct mapping - no slot translation needed!
          }))
      ),
      ...showdownResult.errors
        .filter(
          (error) =>
            !Array.from(showdownResult.pokemonResults.values()).some((r) =>
              r.errors.includes(error)
            )
        )
        .map((error) => ({
          field: 'team',
          message: error,
        })),
    ];

    return {
      isValid: zodResult.isValid && showdownResult.isValid,
      errors: mergedErrors,
      showdownFormatId,
      timestamp: Date.now(),
    };
  }, [
    teamName.value,
    generation.value,
    format.value,
    tier.value,
    teamPokemon.value,
    showdownFormatId,
  ]);

  // Validation helper methods (memoized)
  const getTeamErrors = useCallback(() => {
    return validationState.errors.filter(
      (err) => err.pokemonSlot === undefined
    );
  }, [validationState.errors]);

  const getPokemonErrors = useCallback(
    (index: number) => {
      return validationState.errors.filter((err) => err.pokemonSlot === index);
    },
    [validationState.errors]
  );

  const setActivePokemon = (pokemon: PokemonInTeam | Species | undefined) => {
    if (pokemon === undefined) {
      activePokemon.setValue(undefined);
    } else if ('baseSpecies' in pokemon) {
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

  const setEV = useCallback(
    (stat: StatID, value: number) => {
      if (!activePokemon.value) return;

      const currentTotal = Object.values(activePokemon.value.evs).reduce(
        (sum, ev) => sum + ev,
        0
      );
      const currentStatValue = activePokemon.value.evs[stat];
      const difference = value - currentStatValue;

      // Ensure total EVs don't exceed 510
      if (currentTotal + difference > 510) {
        value = currentStatValue + (510 - currentTotal);
      }

      // Ensure individual stat doesn't exceed 252
      value = Math.min(value, 252);

      // Ensure value is not negative
      value = Math.max(value, 0);

      const newEvs = { ...activePokemon.value.evs, [stat]: value };
      activePokemon.setValue({ ...activePokemon.value, evs: newEvs });
    },
    [activePokemon]
  );

  const setIV = useCallback(
    (stat: StatID, value: number) => {
      if (!activePokemon.value) return;

      // Ensure IV is between 0 and 31
      value = Math.max(0, Math.min(31, value));

      const newIvs = { ...activePokemon.value.ivs, [stat]: value };
      activePokemon.setValue({ ...activePokemon.value, ivs: newIvs });
    },
    [activePokemon]
  );

  const addActivePokemonToTeam = useCallback(() => {
    if (!activePokemon.value) return;
    if (teamPokemon.value.length >= 6) return; // Max 6 Pokemon

    teamPokemon.setValue([...teamPokemon.value, activePokemon.value]);
  }, [teamPokemon, activePokemon]);

  const removePokemonFromTeam = useCallback(
    (index: number) => {
      const newTeam = [...teamPokemon.value];
      newTeam.splice(index, 1);
      teamPokemon.setValue(newTeam);
    },
    [teamPokemon]
  );

  const updatePokemonInTeam = useCallback(
    (index: number, pokemon: PokemonInTeam) => {
      const newTeam = [...teamPokemon.value];
      newTeam[index] = pokemon;
      teamPokemon.setValue(newTeam);
    },
    [teamPokemon]
  );

  const clearTeam = useCallback(() => {
    teamPokemon.setValue([]);
    activePokemon.setValue(undefined);
  }, [teamPokemon, activePokemon]);

  const hasAnyPokemon = useCallback(() => {
    return teamPokemon.value.length > 0;
  }, [teamPokemon]);

  return {
    ...restProps,
    generation,
    format,
    tier,
    teamName,
    activePokemon: {
      value: activePokemon.value,
      setValue: setActivePokemon,
      setLevel,
      setItem,
      setAbility,
      setName,
      setNature,
      setMove,
      setEV,
      setIV,
    },
    teamPokemon: {
      value: teamPokemon.value,
      setValue: teamPokemon.setValue,
      addActivePokemonToTeam,
      clearTeam,
      hasAnyPokemon,
      removePokemonFromTeam,
      updatePokemonInTeam,
    },
    validation: {
      state: validationState,
      getTeamErrors,
      getPokemonErrors,
      isTeamValid: validationState.isValid,
      showdownFormatId,
    },
  };
};

export const createNewPokemonFromSpecies = (
  species: Species
): PokemonInTeam => {
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
