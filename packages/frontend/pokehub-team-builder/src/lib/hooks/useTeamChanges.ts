import type { GenerationNum, Tier } from '@pkmn/dex';
import type {
  PokemonInTeam,
  BattleFormat,
} from '@pokehub/shared/pokemon-types';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface TeamState {
  teamName?: string;
  generation: GenerationNum;
  format: BattleFormat;
  tier: Tier.Singles | Tier.Doubles;
  pokemon: (PokemonInTeam | undefined)[];
}

/**
 * Deep comparison of two Pokemon
 * Compares all properties including species, ability, item, nature, moves, EVs, and IVs
 */
export const arePokemonEqual = (
  p1: PokemonInTeam,
  p2: PokemonInTeam
): boolean => {
  // Compare basic properties
  if (
    p1.species !== p2.species ||
    p1.ability !== p2.ability ||
    p1.item !== p2.item ||
    p1.nature !== p2.nature ||
    p1.gender !== p2.gender ||
    p1.level !== p2.level ||
    p1.name !== p2.name
  ) {
    return false;
  }

  // Compare moves (order matters)
  if (p1.moves.length !== p2.moves.length) return false;
  for (let i = 0; i < p1.moves.length; i++) {
    if (p1.moves[i] !== p2.moves[i]) return false;
  }

  // Compare EVs
  const evStats: Array<keyof typeof p1.evs> = [
    'hp',
    'atk',
    'def',
    'spa',
    'spd',
    'spe',
  ];
  for (const stat of evStats) {
    if (p1.evs[stat] !== p2.evs[stat]) return false;
  }

  // Compare IVs
  const ivStats: Array<keyof typeof p1.ivs> = [
    'hp',
    'atk',
    'def',
    'spa',
    'spd',
    'spe',
  ];
  for (const stat of ivStats) {
    if (p1.ivs[stat] !== p2.ivs[stat]) return false;
  }

  return true;
};

/**
 * Hook to track changes to a Pokemon team
 * Returns whether the team has unsaved changes
 */
export const useTeamChanges = (currentTeamState: TeamState) => {
  // Store the initial/saved state
  const [savedState, setSavedState] = useState<TeamState>(currentTeamState);

  // Track if this is the first render
  const isFirstRender = useRef(true);

  // Initialize saved state on mount
  useEffect(() => {
    if (isFirstRender.current) {
      setSavedState(currentTeamState);
      isFirstRender.current = false;
    }
  }, []);

  /**
   * Deep comparison of two team states
   */
  const areTeamsEqual = useCallback(
    (team1: TeamState, team2: TeamState): boolean => {
      // Compare team configuration
      if (
        team1.teamName !== team2.teamName ||
        team1.generation !== team2.generation ||
        team1.format !== team2.format ||
        team1.tier !== team2.tier
      ) {
        return false;
      }

      // Compare Pokemon array length
      const team1Pokemon = team1.pokemon.filter((p) => p !== undefined);
      const team2Pokemon = team2.pokemon.filter((p) => p !== undefined);

      if (team1Pokemon.length !== team2Pokemon.length) {
        return false;
      }

      // Compare each Pokemon slot
      for (let i = 0; i < team1.pokemon.length; i++) {
        const p1 = team1.pokemon[i];
        const p2 = team2.pokemon[i];

        // Both undefined - continue
        if (p1 === undefined && p2 === undefined) continue;

        // One undefined, one defined - not equal
        if (p1 === undefined || p2 === undefined) return false;

        // Compare Pokemon properties
        if (!arePokemonEqual(p1, p2)) {
          return false;
        }
      }

      return true;
    },
    []
  );

  /**
   * Check if there are unsaved changes
   */
  const hasChanges = useCallback((): boolean => {
    return !areTeamsEqual(currentTeamState, savedState);
  }, [currentTeamState, savedState, areTeamsEqual]);

  /**
   * Mark current state as saved (call after successful save)
   */
  const markAsSaved = useCallback(() => {
    setSavedState(currentTeamState);
  }, [currentTeamState]);

  /**
   * Reset to last saved state (discard changes)
   */
  const resetToSaved = useCallback((): TeamState => {
    return savedState;
  }, [savedState]);

  /**
   * Get list of what changed
   */
  const getChanges = useCallback((): string[] => {
    const changes: string[] = [];

    if (currentTeamState.teamName !== savedState.teamName) {
      changes.push('Team name');
    }
    if (currentTeamState.generation !== savedState.generation) {
      changes.push('Generation');
    }
    if (currentTeamState.format !== savedState.format) {
      changes.push('Format');
    }
    if (currentTeamState.tier !== savedState.tier) {
      changes.push('Tier');
    }

    // Check Pokemon changes
    for (let i = 0; i < currentTeamState.pokemon.length; i++) {
      const currentPokemon = currentTeamState.pokemon[i];
      const savedPokemon = savedState.pokemon[i];

      if (currentPokemon === undefined && savedPokemon === undefined) {
        continue;
      }

      if (currentPokemon === undefined && savedPokemon !== undefined) {
        changes.push(`Removed Pokemon from slot ${i + 1}`);
        continue;
      }

      if (currentPokemon !== undefined && savedPokemon === undefined) {
        changes.push(`Added ${currentPokemon.species} to slot ${i + 1}`);
        continue;
      }

      if (currentPokemon && savedPokemon) {
        if (!arePokemonEqual(currentPokemon, savedPokemon)) {
          changes.push(`Modified ${currentPokemon.species} in slot ${i + 1}`);
        }
      }
    }

    return changes;
  }, [currentTeamState, savedState]);

  return {
    hasChanges: hasChanges(),
    markAsSaved,
    resetToSaved,
    getChanges: getChanges(),
    savedState,
  };
};
