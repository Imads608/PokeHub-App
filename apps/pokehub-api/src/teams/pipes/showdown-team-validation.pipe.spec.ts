import { ShowdownTeamValidationPipe } from './showdown-team-validation.pipe';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AppLogger } from '@pokehub/backend/shared-logger';
import * as showdownValidation from '@pokehub/shared/pokemon-showdown-validation';
import type { CreateTeamDTO, PokemonInTeam } from '@pokehub/shared/pokemon-types';

jest.mock('@pokehub/shared/pokemon-showdown-validation');

describe('ShowdownTeamValidationPipe', () => {
  let pipe: ShowdownTeamValidationPipe;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    setContext: jest.fn(),
  };

  const mockValidateTeamForFormat = jest.mocked(
    showdownValidation.validateTeamForFormat
  );

  const createMockPokemon = (
    overrides?: Partial<PokemonInTeam>
  ): PokemonInTeam => ({
    species: 'Pikachu' as PokemonInTeam['species'],
    name: '',
    ability: 'Static' as PokemonInTeam['ability'],
    item: 'Light Ball' as PokemonInTeam['item'],
    nature: 'Jolly' as PokemonInTeam['nature'],
    gender: 'M',
    level: 50,
    moves: [
      'Thunderbolt',
      'Volt Tackle',
      'Iron Tail',
      'Quick Attack',
    ] as PokemonInTeam['moves'],
    evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    ...overrides,
  });

  const createMockTeamDTO = (
    overrides?: Partial<CreateTeamDTO>
  ): CreateTeamDTO => ({
    name: 'Test Team',
    generation: 9,
    format: 'ou',
    pokemon: [createMockPokemon()],
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowdownTeamValidationPipe,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    pipe = module.get<ShowdownTeamValidationPipe>(ShowdownTeamValidationPipe);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('transform', () => {
    it('should pass valid legal team through', () => {
      const teamDTO = createMockTeamDTO();
      mockValidateTeamForFormat.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        pokemonResults: new Map(),
      });

      const result = pipe.transform(teamDTO);

      expect(result).toEqual(teamDTO);
      expect(mockValidateTeamForFormat).toHaveBeenCalledWith(
        teamDTO,
        'gen9ou'
      );
    });

    it('should construct correct format ID from generation and format', () => {
      const teamDTO = createMockTeamDTO({ generation: 8, format: 'vgc2024' });
      mockValidateTeamForFormat.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        pokemonResults: new Map(),
      });

      pipe.transform(teamDTO);

      expect(mockValidateTeamForFormat).toHaveBeenCalledWith(
        teamDTO,
        'gen8vgc2024'
      );
    });

    it('should throw BadRequestException for invalid team', () => {
      const teamDTO = createMockTeamDTO();
      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: ['Team is invalid'],
        warnings: [],
        pokemonResults: new Map(),
      });

      expect(() => pipe.transform(teamDTO)).toThrow(BadRequestException);
    });

    it('should include formatId in error response', () => {
      const teamDTO = createMockTeamDTO();
      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: ['Team validation failed'],
        warnings: [],
        pokemonResults: new Map(),
      });

      try {
        pipe.transform(teamDTO);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse();
        expect(response).toHaveProperty('formatId', 'gen9ou');
      }
    });

    it('should include team-level errors in response', () => {
      const teamDTO = createMockTeamDTO();
      const teamErrors = ['Species Clause violation', 'Team size exceeded'];
      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: teamErrors,
        warnings: [],
        pokemonResults: new Map(),
      });

      try {
        pipe.transform(teamDTO);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse();
        expect(response).toHaveProperty('errors', teamErrors);
      }
    });

    it('should include slot-indexed pokemon errors in response', () => {
      const teamDTO = createMockTeamDTO({
        pokemon: [
          createMockPokemon({ species: 'Pikachu' as PokemonInTeam['species'] }),
          createMockPokemon({ species: 'Charizard' as PokemonInTeam['species'] }),
        ],
      });

      const pokemonResults = new Map<
        number,
        { isValid: boolean; errors: string[]; warnings: string[] }
      >();
      pokemonResults.set(0, { isValid: false, errors: ['Invalid move: Fly'], warnings: [] });
      pokemonResults.set(1, { isValid: true, errors: [], warnings: [] });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: [],
        warnings: [],
        pokemonResults,
      });

      try {
        pipe.transform(teamDTO);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(response.pokemonErrors).toEqual({
          0: ['Invalid move: Fly'],
        });
      }
    });

    it('should only include pokemon with errors in pokemonErrors', () => {
      const teamDTO = createMockTeamDTO({
        pokemon: [
          createMockPokemon(),
          createMockPokemon(),
          createMockPokemon(),
        ],
      });

      const pokemonResults = new Map<
        number,
        { isValid: boolean; errors: string[]; warnings: string[] }
      >();
      pokemonResults.set(0, { isValid: true, errors: [], warnings: [] });
      pokemonResults.set(1, {
        isValid: false,
        errors: ['Banned ability: Speed Boost'],
        warnings: [],
      });
      pokemonResults.set(2, { isValid: true, errors: [], warnings: [] });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: [],
        warnings: [],
        pokemonResults,
      });

      try {
        pipe.transform(teamDTO);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(response.pokemonErrors).toEqual({
          1: ['Banned ability: Speed Boost'],
        });
        expect(response.pokemonErrors).not.toHaveProperty('0');
        expect(response.pokemonErrors).not.toHaveProperty('2');
      }
    });

    it('should handle banned Pokemon species', () => {
      const teamDTO = createMockTeamDTO({
        pokemon: [
          createMockPokemon({ species: 'Mewtwo' as PokemonInTeam['species'] }),
        ],
      });

      const pokemonResults = new Map<
        number,
        { isValid: boolean; errors: string[]; warnings: string[] }
      >();
      pokemonResults.set(0, {
        isValid: false,
        errors: ['Mewtwo is banned in gen9ou'],
        warnings: [],
      });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: ['Team contains banned Pokemon'],
        warnings: [],
        pokemonResults,
      });

      try {
        pipe.transform(teamDTO);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(response.pokemonErrors).toEqual({
          0: ['Mewtwo is banned in gen9ou'],
        });
      }
    });

    it('should handle banned moves', () => {
      const teamDTO = createMockTeamDTO({
        pokemon: [
          createMockPokemon({
            moves: ['Baton Pass', 'Thunderbolt', 'Iron Tail', 'Quick Attack'] as PokemonInTeam['moves'],
          }),
        ],
      });

      const pokemonResults = new Map<
        number,
        { isValid: boolean; errors: string[]; warnings: string[] }
      >();
      pokemonResults.set(0, {
        isValid: false,
        errors: ['Baton Pass is banned in gen9ou'],
        warnings: [],
      });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: [],
        warnings: [],
        pokemonResults,
      });

      expect(() => pipe.transform(teamDTO)).toThrow(BadRequestException);
    });

    it('should handle banned abilities', () => {
      const teamDTO = createMockTeamDTO({
        pokemon: [
          createMockPokemon({
            ability: 'Arena Trap' as PokemonInTeam['ability'],
          }),
        ],
      });

      const pokemonResults = new Map<
        number,
        { isValid: boolean; errors: string[]; warnings: string[] }
      >();
      pokemonResults.set(0, {
        isValid: false,
        errors: ['Arena Trap is banned'],
        warnings: [],
      });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: [],
        warnings: [],
        pokemonResults,
      });

      expect(() => pipe.transform(teamDTO)).toThrow(BadRequestException);
    });

    it('should handle banned items', () => {
      const teamDTO = createMockTeamDTO({
        pokemon: [
          createMockPokemon({
            item: 'King\'s Rock' as PokemonInTeam['item'],
          }),
        ],
      });

      const pokemonResults = new Map<
        number,
        { isValid: boolean; errors: string[]; warnings: string[] }
      >();
      pokemonResults.set(0, {
        isValid: false,
        errors: ["King's Rock is banned"],
        warnings: [],
      });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: [],
        warnings: [],
        pokemonResults,
      });

      expect(() => pipe.transform(teamDTO)).toThrow(BadRequestException);
    });

    it('should handle Species Clause violation', () => {
      const teamDTO = createMockTeamDTO({
        pokemon: [
          createMockPokemon({ species: 'Pikachu' as PokemonInTeam['species'] }),
          createMockPokemon({ species: 'Pikachu' as PokemonInTeam['species'] }),
        ],
      });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: ['Species Clause: You cannot have more than one Pikachu'],
        warnings: [],
        pokemonResults: new Map(),
      });

      try {
        pipe.transform(teamDTO);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(response.errors).toContain(
          'Species Clause: You cannot have more than one Pikachu'
        );
      }
    });

    it('should return original value unchanged when valid', () => {
      const teamDTO = createMockTeamDTO();
      mockValidateTeamForFormat.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        pokemonResults: new Map(),
      });

      const result = pipe.transform(teamDTO);

      expect(result).toBe(teamDTO);
    });

    it('should log validation start and result', () => {
      const teamDTO = createMockTeamDTO({ generation: 9, format: 'ou' });
      mockValidateTeamForFormat.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        pokemonResults: new Map(),
      });

      pipe.transform(teamDTO);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('generation 9')
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('format ou')
      );
    });

    it('should log warning when validation fails', () => {
      const teamDTO = createMockTeamDTO();
      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: ['Validation failed'],
        warnings: [],
        pokemonResults: new Map(),
      });

      try {
        pipe.transform(teamDTO);
      } catch {
        // Expected
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('validation failed')
      );
    });
  });
});
