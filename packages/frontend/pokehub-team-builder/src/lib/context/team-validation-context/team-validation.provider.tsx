'use client';

import { useTeamEditorContext } from '../team-editor-context/team-editor.context';
import type { TeamValidationState } from './team-validation-state.context.model';
import { TeamValidationContext } from './team-validation.context';
// Type-only import - doesn't bundle the actual code
import type { validateTeamForFormat } from '@pokehub/shared/pokemon-showdown-validation';
import { validateTeam } from '@pokehub/shared/pokemon-types';
import { useCallback, useMemo, useEffect, useState } from 'react';

export interface TeamValidationProviderProps {
  children: React.ReactNode;
}

export const TeamValidationProvider = ({
  children,
}: TeamValidationProviderProps) => {
  const { teamName, generation, format, teamPokemon, showdownFormatId } =
    useTeamEditorContext();

  // State to track if the validation module has loaded
  const [isReady, setIsReady] = useState(false);
  const [validateFn, setValidateFn] = useState<
    typeof validateTeamForFormat | null
  >(null);

  // Dynamically import the validation function (loads @pkmn/sim in background)
  useEffect(() => {
    let mounted = true;

    // Note: Wherever we're referencing pokemon-showdown-validation package (such as format-rules-display.tsx),
    // we must define a chunk name and name it to be the same one used for loading the async component (i.e., format-rules-display)
    // Since that is loaded with webpack chunk name "team-validation", we should use the same here to avoid loading the same
    // resource twice
    import(
      /* webpackPrefetch: true */
      /* webpackChunkName: "team-validation" */
      './showdown-validation-utils'
    )
      .then((module) => {
        if (mounted) {
          setValidateFn(() => module.validateTeamForFormat);
          setIsReady(true);
        }
      })
      .catch((error) => {
        console.error('Failed to load validation module:', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Run validation (memoized - only recomputes when team data changes)
  const validationState: TeamValidationState = useMemo(() => {
    // If validation function isn't loaded yet, return mock state
    if (!isReady || !validateFn) {
      return {
        isValid: true,
        errors: [],
        showdownFormatId,
        timestamp: 0,
      };
    }

    // Run Zod structural validation
    const zodResult = validateTeam({
      name: teamName.value,
      generation: generation.value,
      format: format.value,
      pokemon: teamPokemon.value, // No undefined, no filtering needed!
    });

    // Run Showdown format validation
    const showdownResult = validateFn(
      {
        name: teamName.value || '',
        generation: generation.value,
        format: format.value,
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
    isReady,
    validateFn,
    teamName.value,
    generation.value,
    format.value,
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

  return (
    <TeamValidationContext.Provider
      value={{
        state: validationState,
        getTeamErrors,
        getPokemonErrors,
        isTeamValid: validationState.isValid,
        isReady, // ← Now reflects actual loading state
      }}
    >
      {children}
    </TeamValidationContext.Provider>
  );
};
