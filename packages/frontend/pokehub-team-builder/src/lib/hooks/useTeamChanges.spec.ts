import {
  useTeamChanges,
  arePokemonEqual,
  type TeamState,
} from './useTeamChanges';
import type {
  AbilityName,
  GenderName,
  GenerationNum,
  ItemName,
  MoveName,
  NatureName,
  SpeciesName,
  Tier,
} from '@pkmn/dex';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import { renderHook, act } from '@testing-library/react';

describe('arePokemonEqual', () => {
  const basePokemon: PokemonInTeam = {
    species: 'Pikachu' as PokemonInTeam['species'],
    name: 'Pika',
    ability: 'Static' as PokemonInTeam['ability'],
    item: 'Light Ball' as PokemonInTeam['item'],
    nature: 'Jolly' as PokemonInTeam['nature'],
    gender: 'M' as PokemonInTeam['gender'],
    level: 50,
    moves: [
      'Thunder',
      'Quick Attack',
      'Iron Tail',
      'Thunderbolt',
    ] as PokemonInTeam['moves'],
    evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  };

  it('should return true for identical Pokemon', () => {
    const pokemon1 = { ...basePokemon };
    const pokemon2 = { ...basePokemon };
    expect(arePokemonEqual(pokemon1, pokemon2)).toBe(true);
  });

  it('should return false when species differs', () => {
    const pokemon1 = { ...basePokemon };
    const pokemon2 = { ...basePokemon, species: 'Raichu' };
    expect(arePokemonEqual(pokemon1, pokemon2 as PokemonInTeam)).toBe(false);
  });

  it('should return false when ability differs', () => {
    const pokemon1 = { ...basePokemon };
    const pokemon2 = { ...basePokemon, ability: 'Lightning Rod' };
    expect(arePokemonEqual(pokemon1, pokemon2 as PokemonInTeam)).toBe(false);
  });

  it('should return false when item differs', () => {
    const pokemon1 = { ...basePokemon };
    const pokemon2 = { ...basePokemon, item: 'Choice Band' };
    expect(arePokemonEqual(pokemon1, pokemon2 as PokemonInTeam)).toBe(false);
  });

  it('should return false when nature differs', () => {
    const pokemon1 = { ...basePokemon };
    const pokemon2 = { ...basePokemon, nature: 'Adamant' };
    expect(arePokemonEqual(pokemon1, pokemon2 as PokemonInTeam)).toBe(false);
  });

  it('should return false when gender differs', () => {
    const pokemon1 = { ...basePokemon };
    const pokemon2 = { ...basePokemon, gender: 'F' as GenderName };
    expect(arePokemonEqual(pokemon1, pokemon2)).toBe(false);
  });

  it('should return false when level differs', () => {
    const pokemon1 = { ...basePokemon };
    const pokemon2 = { ...basePokemon, level: 100 };
    expect(arePokemonEqual(pokemon1, pokemon2)).toBe(false);
  });

  it('should return false when name differs', () => {
    const pokemon1 = { ...basePokemon };
    const pokemon2 = { ...basePokemon, name: 'Sparky' };
    expect(arePokemonEqual(pokemon1, pokemon2)).toBe(false);
  });

  describe('moves comparison', () => {
    it('should return false when moves differ', () => {
      const pokemon1 = { ...basePokemon };
      const pokemon2 = {
        ...basePokemon,
        moves: ['Thunder', 'Quick Attack', 'Iron Tail', 'Volt Tackle'],
      };
      expect(arePokemonEqual(pokemon1, pokemon2 as PokemonInTeam)).toBe(false);
    });

    it('should return false when move order differs', () => {
      const pokemon1 = { ...basePokemon };
      const pokemon2 = {
        ...basePokemon,
        moves: ['Quick Attack', 'Thunder', 'Iron Tail', 'Thunderbolt'],
      };
      expect(arePokemonEqual(pokemon1, pokemon2 as PokemonInTeam)).toBe(false);
    });

    it('should return false when moves array length differs', () => {
      const pokemon1 = { ...basePokemon };
      const pokemon2 = {
        ...basePokemon,
        moves: ['Thunder', 'Quick Attack', 'Iron Tail'],
      };
      expect(arePokemonEqual(pokemon1, pokemon2 as PokemonInTeam)).toBe(false);
    });
  });

  describe('EVs comparison', () => {
    it('should return false when any EV differs', () => {
      const pokemon1 = { ...basePokemon };
      const pokemon2 = {
        ...basePokemon,
        evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 253 },
      };
      expect(arePokemonEqual(pokemon1, pokemon2)).toBe(false);
    });

    it('should return false when HP EV differs', () => {
      const pokemon1 = { ...basePokemon };
      const pokemon2 = {
        ...basePokemon,
        evs: { ...basePokemon.evs, hp: 4 },
      };
      expect(arePokemonEqual(pokemon1, pokemon2)).toBe(false);
    });

    it('should return false when Attack EV differs', () => {
      const pokemon1 = { ...basePokemon };
      const pokemon2 = {
        ...basePokemon,
        evs: { ...basePokemon.evs, atk: 248 },
      };
      expect(arePokemonEqual(pokemon1, pokemon2)).toBe(false);
    });
  });

  describe('IVs comparison', () => {
    it('should return false when any IV differs', () => {
      const pokemon1 = { ...basePokemon };
      const pokemon2 = {
        ...basePokemon,
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 0 },
      };
      expect(arePokemonEqual(pokemon1, pokemon2)).toBe(false);
    });

    it('should return false when Speed IV differs (Trick Room)', () => {
      const pokemon1 = { ...basePokemon };
      const pokemon2 = {
        ...basePokemon,
        ivs: { ...basePokemon.ivs, spe: 0 },
      };
      expect(arePokemonEqual(pokemon1, pokemon2)).toBe(false);
    });
  });

  it('should handle deep copies correctly', () => {
    const pokemon1 = { ...basePokemon };
    const pokemon2 = {
      ...basePokemon,
      moves: [...basePokemon.moves],
      evs: { ...basePokemon.evs },
      ivs: { ...basePokemon.ivs },
    };
    expect(arePokemonEqual(pokemon1, pokemon2)).toBe(true);
  });
});

describe('useTeamChanges', () => {
  const baseTeamState: TeamState = {
    teamName: 'My Team',
    generation: 9 as GenerationNum,
    format: 'Singles',
    tier: 'OU' as Tier.Singles,
    pokemon: [
      {
        species: 'Pikachu' as SpeciesName,
        name: 'Pika',
        ability: 'Static' as AbilityName,
        item: 'Light Ball' as ItemName,
        nature: 'Jolly' as NatureName,
        gender: 'M' as GenderName,
        level: 50,
        moves: [
          'Thunder' as MoveName,
          'Quick Attack' as MoveName,
          'Iron Tail' as MoveName,
          'Thunderbolt' as MoveName,
        ],
        evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ],
  };

  it('should initialize with no changes', () => {
    const { result } = renderHook(() => useTeamChanges(baseTeamState));

    expect(result.current.hasChanges).toBe(false);
  });

  it('should detect changes when team name changes', () => {
    const { result, rerender } = renderHook(
      ({ teamState }) => useTeamChanges(teamState),
      { initialProps: { teamState: baseTeamState } }
    );

    const modifiedState: TeamState = { ...baseTeamState, teamName: 'New Team Name' };
    rerender({ teamState: modifiedState });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.getChanges).toContain('Team name');
  });

  it('should detect changes when generation changes', () => {
    const { result, rerender } = renderHook(
      ({ teamState }) => useTeamChanges(teamState),
      { initialProps: { teamState: baseTeamState } }
    );

    const modifiedState: TeamState = { ...baseTeamState, generation: 8 as GenerationNum };
    rerender({ teamState: modifiedState });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.getChanges).toContain('Generation');
  });

  it('should detect changes when Pokemon is added', () => {
    const { result, rerender } = renderHook(
      ({ teamState }) => useTeamChanges(teamState),
      { initialProps: { teamState: baseTeamState } }
    );

    const newPokemon: PokemonInTeam = {
      species: 'Charizard' as SpeciesName,
      name: 'Charizard',
      ability: 'Blaze' as AbilityName,
      item: '' as ItemName,
      nature: 'Adamant' as NatureName,
      gender: 'M' as GenderName,
      level: 50,
      moves: [
        'Flare Blitz' as MoveName,
        'Dragon Claw' as MoveName,
        'Earthquake' as MoveName,
        'Roost' as MoveName,
      ],
      evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    };

    const modifiedState: TeamState = {
      ...baseTeamState,
      pokemon: [
        baseTeamState.pokemon[0],
        newPokemon,
        undefined,
        undefined,
        undefined,
        undefined,
      ],
    };
    rerender({ teamState: modifiedState });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.getChanges).toContain('Added Charizard to slot 2');
  });

  it('should detect changes when Pokemon is removed', () => {
    const { result, rerender } = renderHook(
      ({ teamState }) => useTeamChanges(teamState),
      { initialProps: { teamState: baseTeamState } }
    );

    const modifiedState: TeamState = {
      ...baseTeamState,
      pokemon: [
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ],
    };
    rerender({ teamState: modifiedState });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.getChanges).toContain('Removed Pokemon from slot 1');
  });

  it('should detect changes when Pokemon is modified', () => {
    const { result, rerender } = renderHook(
      ({ teamState }) => useTeamChanges(teamState),
      { initialProps: { teamState: baseTeamState } }
    );

    const originalPokemon = baseTeamState.pokemon[0];
    if (!originalPokemon) {
      throw new Error('Expected pokemon at index 0 for test setup');
    }

    const modifiedPokemon: PokemonInTeam = {
      ...originalPokemon,
      ability: 'Lightning Rod' as AbilityName,
    };

    const modifiedState: TeamState = {
      ...baseTeamState,
      pokemon: [
        modifiedPokemon,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ],
    };
    rerender({ teamState: modifiedState });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.getChanges).toContain('Modified Pikachu in slot 1');
  });

  it('should reset hasChanges when markAsSaved is called', () => {
    const { result, rerender } = renderHook(
      ({ teamState }) => useTeamChanges(teamState),
      { initialProps: { teamState: baseTeamState } }
    );

    const modifiedState: TeamState = { ...baseTeamState, teamName: 'New Team Name' };
    rerender({ teamState: modifiedState });

    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.markAsSaved();
    });

    expect(result.current.hasChanges).toBe(false);
  });

  it('should return saved state via resetToSaved', () => {
    const { result, rerender } = renderHook(
      ({ teamState }) => useTeamChanges(teamState),
      { initialProps: { teamState: baseTeamState } }
    );

    const modifiedState: TeamState = { ...baseTeamState, teamName: 'New Team Name' };
    rerender({ teamState: modifiedState });

    const savedState = result.current.resetToSaved();

    expect(savedState.teamName).toBe('My Team');
    expect(savedState).toEqual(baseTeamState);
  });

  it('should handle multiple changes', () => {
    const { result, rerender } = renderHook(
      ({ teamState }) => useTeamChanges(teamState),
      { initialProps: { teamState: baseTeamState } }
    );

    const modifiedState: TeamState = {
      ...baseTeamState,
      teamName: 'New Name',
      generation: 8 as GenerationNum,
      format: 'Doubles' as const,
    };
    rerender({ teamState: modifiedState });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.getChanges).toContain('Team name');
    expect(result.current.getChanges).toContain('Generation');
    expect(result.current.getChanges).toContain('Format');
  });

  it('should return savedState', () => {
    const { result, rerender } = renderHook(
      ({ teamState }) => useTeamChanges(teamState),
      { initialProps: { teamState: baseTeamState } }
    );

    expect(result.current.savedState).toEqual(baseTeamState);

    const modifiedState: TeamState = { ...baseTeamState, teamName: 'New Team Name' };
    rerender({ teamState: modifiedState });

    // Saved state should remain the original
    expect(result.current.savedState.teamName).toBe('My Team');
  });
});
