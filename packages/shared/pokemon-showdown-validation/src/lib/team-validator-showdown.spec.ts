import {
  validateTeamForFormat,
  isPokemonBanned,
  isMoveBanned,
  isAbilityBanned,
  isItemBanned,
} from './team-validator-showdown';
import type {
  SpeciesName,
  AbilityName,
  ItemName,
  MoveName,
  NatureName,
} from '@pkmn/dex';
import type {
  PokemonInTeam,
  PokemonTeam,
} from '@pokehub/shared/pokemon-types';

// Helper to create a valid Pokemon with species-appropriate defaults
const createPokemon = (overrides?: Partial<PokemonInTeam>): PokemonInTeam => {
  const species = overrides?.species || ('Pikachu' as SpeciesName);

  // Define species-specific defaults
  const speciesDefaults: Record<string, Partial<PokemonInTeam>> = {
    Pikachu: {
      ability: 'Static' as AbilityName,
      item: 'Light Ball' as ItemName,
      moves: [
        'Thunderbolt' as MoveName,
        'Quick Attack' as MoveName,
        'Iron Tail' as MoveName,
        'Volt Tackle' as MoveName,
      ],
    },
    Charizard: {
      ability: 'Blaze' as AbilityName,
      item: 'Heavy-Duty Boots' as ItemName,
      moves: [
        'Flamethrower' as MoveName,
        'Air Slash' as MoveName,
        'Dragon Pulse' as MoveName,
        'Roost' as MoveName,
      ],
    },
    Mewtwo: {
      ability: 'Pressure' as AbilityName,
      item: 'Life Orb' as ItemName,
      moves: [
        'Psychic' as MoveName,
        'Ice Beam' as MoveName,
        'Aura Sphere' as MoveName,
        'Fire Blast' as MoveName,
      ],
    },
    Blastoise: {
      ability: 'Torrent' as AbilityName,
      item: 'Leftovers' as ItemName,
      moves: [
        'Hydro Pump' as MoveName,
        'Ice Beam' as MoveName,
        'Rapid Spin' as MoveName,
        'Earthquake' as MoveName,
      ],
    },
    Venusaur: {
      ability: 'Overgrow' as AbilityName,
      item: 'Black Sludge' as ItemName,
      moves: [
        'Giga Drain' as MoveName,
        'Sludge Bomb' as MoveName,
        'Synthesis' as MoveName,
        'Sleep Powder' as MoveName,
      ],
    },
    Alakazam: {
      ability: 'Magic Guard' as AbilityName,
      item: 'Focus Sash' as ItemName,
      moves: [
        'Psychic' as MoveName,
        'Shadow Ball' as MoveName,
        'Focus Blast' as MoveName,
        'Recover' as MoveName,
      ],
    },
    Gengar: {
      ability: 'Cursed Body' as AbilityName,
      item: 'Choice Specs' as ItemName,
      moves: [
        'Shadow Ball' as MoveName,
        'Sludge Wave' as MoveName,
        'Focus Blast' as MoveName,
        'Trick' as MoveName,
      ],
    },
    Dragonite: {
      ability: 'Multiscale' as AbilityName,
      item: 'Choice Band' as ItemName,
      moves: [
        'Extreme Speed' as MoveName,
        'Outrage' as MoveName,
        'Earthquake' as MoveName,
        'Fire Punch' as MoveName,
      ],
    },
  };

  const defaults = speciesDefaults[species] || speciesDefaults['Pikachu'];

  return {
    name: '',
    species,
    ability: defaults.ability as AbilityName,
    item: defaults.item as ItemName,
    nature: 'Jolly' as NatureName,
    gender: 'M',
    level: 100, // Singles formats (OU) use level 100; VGC uses level 50
    moves: defaults.moves as MoveName[],
    evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    ...overrides,
  };
};

// Helper to create a valid team
const createTeam = (
  pokemon: PokemonInTeam[] = [createPokemon()]
): PokemonTeam<'Singles'> => ({
  name: 'Test Team',
  pokemon,
  generation: 9,
  format: 'Singles',
  tier: 'OU',
});

describe('Team Validator (Showdown)', () => {
  describe('isPokemonBanned', () => {
    it('should return false for legal Pokemon in OU', () => {
      expect(isPokemonBanned('Pikachu' as SpeciesName, 'gen9ou')).toBe(false);
      expect(isPokemonBanned('Landorus-Therian' as SpeciesName, 'gen9ou')).toBe(
        false
      );
    });

    it('should return true for banned Pokemon in specific formats', () => {
      // Mewtwo is typically banned in OU (Uber tier)
      expect(isPokemonBanned('Mewtwo' as SpeciesName, 'gen9ou')).toBe(true);
    });

    it('should return false for non-existent Pokemon', () => {
      expect(isPokemonBanned('FakePokemon' as SpeciesName, 'gen9ou')).toBe(
        false
      );
    });

    it('should return false for invalid format', () => {
      expect(isPokemonBanned('Pikachu' as SpeciesName, 'invalidformat')).toBe(
        false
      );
    });
  });

  describe('isMoveBanned', () => {
    it('should return false for legal moves', () => {
      expect(isMoveBanned('Thunderbolt' as MoveName, 'gen9ou')).toBe(false);
      expect(isMoveBanned('Earthquake' as MoveName, 'gen9ou')).toBe(false);
    });

    it('should return false for non-existent moves', () => {
      expect(isMoveBanned('FakeMove' as MoveName, 'gen9ou')).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(isMoveBanned('Thunderbolt' as MoveName, 'invalidformat')).toBe(
        false
      );
    });
  });

  describe('isAbilityBanned', () => {
    it('should return false for legal abilities', () => {
      expect(isAbilityBanned('Intimidate' as AbilityName, 'gen9ou')).toBe(
        false
      );
      expect(isAbilityBanned('Static' as AbilityName, 'gen9ou')).toBe(false);
    });

    it('should return false for non-existent abilities', () => {
      expect(isAbilityBanned('FakeAbility' as AbilityName, 'gen9ou')).toBe(
        false
      );
    });

    it('should return false for invalid format', () => {
      expect(
        isAbilityBanned('Intimidate' as AbilityName, 'invalidformat')
      ).toBe(false);
    });
  });

  describe('isItemBanned', () => {
    it('should return false for legal items in OU', () => {
      expect(isItemBanned('Choice Scarf' as ItemName, 'gen9ou')).toBe(false);
      expect(isItemBanned('Leftovers' as ItemName, 'gen9ou')).toBe(false);
    });

    it('should return false for non-existent items', () => {
      expect(isItemBanned('FakeItem' as ItemName, 'gen9ou')).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(isItemBanned('Choice Scarf' as ItemName, 'invalidformat')).toBe(
        false
      );
    });
  });

  describe('validateTeamForFormat', () => {
    it('should validate a legal team', () => {
      const team = createTeam([
        createPokemon({ species: 'Pikachu' as SpeciesName }),
        createPokemon({ species: 'Charizard' as SpeciesName }),
      ]);
      const result = validateTeamForFormat(team, 'gen9ou');

      if (!result.isValid) {
        console.log('Team validation errors:', result.errors);
      }

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect species clause violations', () => {
      const team = createTeam([
        createPokemon({ species: 'Pikachu' as SpeciesName }),
        createPokemon({ species: 'Pikachu' as SpeciesName }), // Duplicate
      ]);
      const result = validateTeamForFormat(team, 'gen9ou');

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Species Clause'))).toBe(
        true
      );
    });

    it('should validate empty team', () => {
      const team = createTeam([]);
      const result = validateTeamForFormat(team, 'gen9ou');

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('must bring at least'))).toBe(
        true
      );
    });

    it('should detect team size violations', () => {
      const team = createTeam([
        createPokemon({ species: 'Pikachu' as SpeciesName }),
        createPokemon({ species: 'Charizard' as SpeciesName }),
        createPokemon({ species: 'Blastoise' as SpeciesName }),
        createPokemon({ species: 'Venusaur' as SpeciesName }),
        createPokemon({ species: 'Alakazam' as SpeciesName }),
        createPokemon({ species: 'Gengar' as SpeciesName }),
        createPokemon({ species: 'Dragonite' as SpeciesName }), // 7th Pokemon
      ]);
      const result = validateTeamForFormat(team, 'gen9ou');

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('may only bring up to'))
      ).toBe(true);
    });

    it('should return error for invalid format', () => {
      const team = createTeam();
      const result = validateTeamForFormat(team, 'invalidformat');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Format 'invalidformat' does not exist");
    });

    it('should validate team with banned Pokemon', () => {
      const team = createTeam([
        createPokemon({ species: 'Mewtwo' as SpeciesName }), // Banned in OU
        createPokemon({ species: 'Pikachu' as SpeciesName }),
      ]);
      const result = validateTeamForFormat(team, 'gen9ou');

      expect(result.isValid).toBe(false);
      expect(result.pokemonResults.size).toBeGreaterThan(0);
    });

    it('should provide per-Pokemon validation results', () => {
      const team = createTeam([
        createPokemon({ species: 'Pikachu' as SpeciesName }),
        createPokemon({ species: 'Mewtwo' as SpeciesName }), // Banned
      ]);
      const result = validateTeamForFormat(team, 'gen9ou');

      expect(result.pokemonResults.has(0)).toBe(true);
      expect(result.pokemonResults.has(1)).toBe(true);

      const pikachu = result.pokemonResults.get(0);
      const mewtwo = result.pokemonResults.get(1);

      expect(pikachu?.isValid).toBe(true);
      expect(mewtwo?.isValid).toBe(false);
    });
  });
});
