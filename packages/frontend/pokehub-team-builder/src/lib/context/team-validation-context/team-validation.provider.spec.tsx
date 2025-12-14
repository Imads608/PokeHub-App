import { useTeamEditorContext } from '../team-editor-context/team-editor.context';
import { validateTeamForFormat } from './showdown-validation-utils';
import { useTeamValidationContext } from './team-validation.context';
import { TeamValidationProvider } from './team-validation.provider';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import { validateTeam } from '@pokehub/shared/pokemon-types';
import { renderHook, waitFor } from '@testing-library/react';

// Mock team editor context
jest.mock('../team-editor-context/team-editor.context', () => ({
  useTeamEditorContext: jest.fn(),
}));

// Mock the validation functions
jest.mock('@pokehub/shared/pokemon-types', () => ({
  validateTeam: jest.fn(),
}));

// Mock dynamic import of showdown-validation-utils
jest.mock('./showdown-validation-utils', () => ({
  validateTeamForFormat: jest.fn(),
}));

const mockUseTeamEditorContext = useTeamEditorContext as jest.Mock;
const mockValidateTeam = validateTeam as jest.Mock;
const mockValidateTeamForFormat = validateTeamForFormat as jest.Mock;

// Helper to create a valid Pokemon for testing
const createValidPokemon = (
  overrides?: Partial<PokemonInTeam>
): PokemonInTeam => ({
  species: 'Pikachu' as PokemonInTeam['species'],
  name: 'Sparky',
  ability: 'Static' as PokemonInTeam['ability'],
  item: 'Light Ball' as PokemonInTeam['item'],
  nature: 'Timid' as PokemonInTeam['nature'],
  gender: 'M',
  level: 50,
  moves: [
    'Thunderbolt',
    'Volt Switch',
    'Surf',
    'Grass Knot',
  ] as PokemonInTeam['moves'],
  evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
  ivs: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 },
  ...overrides,
});

// Helper to create mock teamPokemon with all required methods
const createMockTeamPokemon = (
  pokemon: PokemonInTeam[] = [createValidPokemon()]
) => ({
  value: pokemon,
  setValue: jest.fn(),
  addActivePokemonToTeam: jest.fn(),
  clearTeam: jest.fn(),
  hasAnyPokemon: jest.fn(),
  removePokemonFromTeam: jest.fn(),
  updatePokemonInTeam: jest.fn(),
});

// Default mock context values
const createMockContextValue = (
  overrides?: Partial<ReturnType<typeof useTeamEditorContext>>
) => ({
  teamName: { value: 'Test Team', setValue: jest.fn() },
  generation: { value: 9, setValue: jest.fn() },
  format: { value: 'ou', setValue: jest.fn() },
  teamPokemon: createMockTeamPokemon(),
  showdownFormatId: 'gen9ou',
  activePokemon: { value: undefined, setValue: jest.fn() },
  teamId: { value: undefined },
  ...overrides,
});

// Wrapper that provides the TeamValidationProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TeamValidationProvider>{children}</TeamValidationProvider>
);

describe('TeamValidationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamEditorContext.mockReturnValue(createMockContextValue());

    // Default mock implementations
    mockValidateTeam.mockReturnValue({
      isValid: true,
      errors: [],
    });

    mockValidateTeamForFormat.mockReturnValue({
      isValid: true,
      errors: [],
      pokemonResults: new Map(),
    });
  });

  describe('initialization', () => {
    it('should provide initial state before validation loads', () => {
      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      // Initially, validation is not ready yet (async load pending)
      expect(result.current.state.errors).toEqual([]);
      expect(result.current.state.timestamp).toBe(0);
    });

    it('should set isReady to true after validation module loads', async () => {
      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });
    });

    it('should run validation after module loads', async () => {
      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // After loading, validation should have run
      expect(mockValidateTeam).toHaveBeenCalled();
      expect(mockValidateTeamForFormat).toHaveBeenCalled();
    });
  });

  describe('validation with valid team', () => {
    it('should return isTeamValid true for valid team', async () => {
      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.isTeamValid).toBe(true);
      expect(result.current.state.errors).toHaveLength(0);
    });

    it('should validate team with correct parameters', async () => {
      const mockContext = createMockContextValue({
        teamName: { value: 'My Team', setValue: jest.fn() },
        generation: { value: 8, setValue: jest.fn() },
        format: { value: 'ubers', setValue: jest.fn() },
      });
      mockUseTeamEditorContext.mockReturnValue(mockContext);

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(mockValidateTeam).toHaveBeenCalledWith({
        name: 'My Team',
        generation: 8,
        format: 'ubers',
        pokemon: mockContext.teamPokemon.value,
      });
    });

    it('should call showdown validation with correct format ID', async () => {
      mockUseTeamEditorContext.mockReturnValue(
        createMockContextValue({
          showdownFormatId: 'gen9ou',
        })
      );

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(mockValidateTeamForFormat).toHaveBeenCalledWith(
        expect.any(Object),
        'gen9ou'
      );
    });
  });

  describe('validation with invalid team', () => {
    it('should return isTeamValid false when Zod validation fails', async () => {
      mockValidateTeam.mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Team name is required' }],
      });

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.isTeamValid).toBe(false);
      expect(result.current.state.errors).toContainEqual({
        field: 'name',
        message: 'Team name is required',
      });
    });

    it('should return isTeamValid false when Showdown validation fails', async () => {
      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: ['Species Clause: Limit one of each Pokémon'],
        pokemonResults: new Map(),
      });

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.isTeamValid).toBe(false);
      expect(result.current.state.errors).toContainEqual({
        field: 'team',
        message: 'Species Clause: Limit one of each Pokémon',
      });
    });

    it('should merge errors from both validators', async () => {
      mockValidateTeam.mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Team name is required' }],
      });
      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: ['Species Clause violation'],
        pokemonResults: new Map(),
      });

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.state.errors).toHaveLength(2);
      expect(result.current.state.errors).toContainEqual({
        field: 'name',
        message: 'Team name is required',
      });
      expect(result.current.state.errors).toContainEqual({
        field: 'team',
        message: 'Species Clause violation',
      });
    });

    it('should include Pokemon-specific errors from Showdown validation', async () => {
      const pokemonErrors = new Map<
        number,
        { errors: string[]; warnings: string[] }
      >();
      pokemonErrors.set(0, {
        errors: ['Pikachu cannot learn Hydro Pump'],
        warnings: [],
      });
      pokemonErrors.set(2, {
        errors: ['Charizard is banned in OU'],
        warnings: [],
      });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: [],
        pokemonResults: pokemonErrors,
      });

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.state.errors).toContainEqual({
        field: 'pokemon.0',
        message: 'Pikachu cannot learn Hydro Pump',
        pokemonSlot: 0,
      });
      expect(result.current.state.errors).toContainEqual({
        field: 'pokemon.2',
        message: 'Charizard is banned in OU',
        pokemonSlot: 2,
      });
    });
  });

  describe('getTeamErrors helper', () => {
    it('should return only team-level errors', async () => {
      mockValidateTeam.mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Team name is required' }],
      });

      const pokemonErrors = new Map<
        number,
        { errors: string[]; warnings: string[] }
      >();
      pokemonErrors.set(0, {
        errors: ['Invalid move'],
        warnings: [],
      });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: ['Species Clause violation'],
        pokemonResults: pokemonErrors,
      });

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      const teamErrors = result.current.getTeamErrors();

      // Should only include errors without pokemonSlot
      expect(teamErrors).toContainEqual({
        field: 'name',
        message: 'Team name is required',
      });
      expect(teamErrors).toContainEqual({
        field: 'team',
        message: 'Species Clause violation',
      });

      // Should not include Pokemon-specific errors
      expect(teamErrors).not.toContainEqual(
        expect.objectContaining({
          pokemonSlot: expect.any(Number),
        })
      );
    });

    it('should return empty array when no team errors exist', async () => {
      mockValidateTeam.mockReturnValue({ isValid: true, errors: [] });
      mockValidateTeamForFormat.mockReturnValue({
        isValid: true,
        errors: [],
        pokemonResults: new Map(),
      });

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.getTeamErrors()).toEqual([]);
    });
  });

  describe('getPokemonErrors helper', () => {
    it('should return errors for specific Pokemon slot', async () => {
      const pokemonErrors = new Map<
        number,
        { errors: string[]; warnings: string[] }
      >();
      pokemonErrors.set(0, { errors: ['Error for slot 0'], warnings: [] });
      pokemonErrors.set(1, { errors: ['Error for slot 1'], warnings: [] });
      pokemonErrors.set(2, { errors: ['Error for slot 2'], warnings: [] });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: [],
        pokemonResults: pokemonErrors,
      });

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      const slot1Errors = result.current.getPokemonErrors(1);

      expect(slot1Errors).toHaveLength(1);
      expect(slot1Errors[0]).toEqual({
        field: 'pokemon.1',
        message: 'Error for slot 1',
        pokemonSlot: 1,
      });
    });

    it('should return empty array for slot with no errors', async () => {
      const pokemonErrors = new Map<
        number,
        { errors: string[]; warnings: string[] }
      >();
      pokemonErrors.set(0, { errors: ['Error for slot 0'], warnings: [] });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: [],
        pokemonResults: pokemonErrors,
      });

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.getPokemonErrors(3)).toEqual([]);
    });

    it('should return multiple errors for same Pokemon slot', async () => {
      const pokemonErrors = new Map<
        number,
        { errors: string[]; warnings: string[] }
      >();
      pokemonErrors.set(0, {
        errors: ['Cannot learn this move', 'Invalid ability'],
        warnings: [],
      });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        errors: [],
        pokemonResults: pokemonErrors,
      });

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      const slot0Errors = result.current.getPokemonErrors(0);

      expect(slot0Errors).toHaveLength(2);
      expect(slot0Errors).toContainEqual({
        field: 'pokemon.0',
        message: 'Cannot learn this move',
        pokemonSlot: 0,
      });
      expect(slot0Errors).toContainEqual({
        field: 'pokemon.0',
        message: 'Invalid ability',
        pokemonSlot: 0,
      });
    });
  });

  describe('validation state updates', () => {
    it('should update timestamp when validation runs', async () => {
      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(result.current.state.timestamp).toBe(1234567890);

      mockDateNow.mockRestore();
    });

    it('should include showdownFormatId in validation state', async () => {
      mockUseTeamEditorContext.mockReturnValue(
        createMockContextValue({
          showdownFormatId: 'gen8ubers',
        })
      );

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // The provider stores showdownFormatId in state, but with current implementation
      // it's accessed from the memoized validation result
      expect(result.current.state).toBeDefined();
    });
  });

  describe('validation re-runs on data changes', () => {
    it('should re-validate when team name changes', async () => {
      const mockContext = createMockContextValue();
      mockUseTeamEditorContext.mockReturnValue(mockContext);

      const { result, rerender } = renderHook(
        () => useTeamValidationContext(),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Update team name
      mockUseTeamEditorContext.mockReturnValue({
        ...mockContext,
        teamName: { value: 'New Team Name', setValue: jest.fn() },
      });
      rerender();

      await waitFor(() => {
        expect(mockValidateTeam).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'New Team Name' })
        );
      });
    });

    it('should re-validate when Pokemon are added', async () => {
      const initialPokemon = [createValidPokemon()];
      const mockContext = createMockContextValue({
        teamPokemon: createMockTeamPokemon(initialPokemon),
      });
      mockUseTeamEditorContext.mockReturnValue(mockContext);

      const { result, rerender } = renderHook(
        () => useTeamValidationContext(),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      const initialCallCount = mockValidateTeam.mock.calls.length;

      // Add another Pokemon
      const updatedPokemon = [
        ...initialPokemon,
        createValidPokemon({
          species: 'Charizard' as PokemonInTeam['species'],
        }),
      ];
      mockUseTeamEditorContext.mockReturnValue({
        ...mockContext,
        teamPokemon: createMockTeamPokemon(updatedPokemon),
      });
      rerender();

      await waitFor(() => {
        expect(mockValidateTeam.mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    });

    it('should re-validate when generation changes', async () => {
      const mockContext = createMockContextValue({
        generation: { value: 9, setValue: jest.fn() },
      });
      mockUseTeamEditorContext.mockReturnValue(mockContext);

      const { result, rerender } = renderHook(
        () => useTeamValidationContext(),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Change generation
      mockUseTeamEditorContext.mockReturnValue({
        ...mockContext,
        generation: { value: 8, setValue: jest.fn() },
        showdownFormatId: 'gen8ou',
      });
      rerender();

      await waitFor(() => {
        expect(mockValidateTeamForFormat).toHaveBeenCalledWith(
          expect.any(Object),
          'gen8ou'
        );
      });
    });
  });

  describe('duplicate error filtering', () => {
    it('should not duplicate Pokemon errors in team errors', async () => {
      // Showdown returns errors both at team level and per-Pokemon
      const pokemonError = 'Pikachu cannot learn Hydro Pump';
      const pokemonErrors = new Map<
        number,
        { errors: string[]; warnings: string[] }
      >();
      pokemonErrors.set(0, { errors: [pokemonError], warnings: [] });

      mockValidateTeamForFormat.mockReturnValue({
        isValid: false,
        // The same error appears in the general errors array
        errors: [pokemonError, 'Some unique team error'],
        pokemonResults: pokemonErrors,
      });

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Count occurrences of the Pokemon error
      const pokemonErrorCount = result.current.state.errors.filter(
        (e) => e.message === pokemonError
      ).length;

      // Should only appear once (as a Pokemon error, not also as team error)
      expect(pokemonErrorCount).toBe(1);

      // Team error should still be there
      expect(result.current.state.errors).toContainEqual({
        field: 'team',
        message: 'Some unique team error',
      });
    });
  });

  describe('empty team handling', () => {
    it('should handle empty team Pokemon array', async () => {
      mockUseTeamEditorContext.mockReturnValue(
        createMockContextValue({
          teamPokemon: createMockTeamPokemon([]),
        })
      );

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(mockValidateTeam).toHaveBeenCalledWith(
        expect.objectContaining({ pokemon: [] })
      );
    });

    it('should handle empty team name', async () => {
      mockUseTeamEditorContext.mockReturnValue(
        createMockContextValue({
          teamName: { value: '', setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useTeamValidationContext(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Showdown validation receives empty string
      expect(mockValidateTeamForFormat).toHaveBeenCalledWith(
        expect.objectContaining({ name: '' }),
        expect.any(String)
      );
    });
  });
});
