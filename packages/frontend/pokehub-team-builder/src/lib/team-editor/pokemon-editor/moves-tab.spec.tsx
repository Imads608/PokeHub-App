import { MovesTab, type MovesTabProps } from './moves-tab';
import type { Species } from '@pkmn/dex';
import { Tabs } from '@pokehub/frontend/shared-ui-components';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock context
const mockSetMove = jest.fn();

jest.mock('../../context/team-editor-context/team-editor.context', () => ({
  useTeamEditorContext: () => ({
    activePokemon: {
      setMove: mockSetMove,
    },
    generation: { value: 9 },
    validation: {
      showdownFormatId: 'gen9ou',
    },
  }),
}));

// Mock data provider hooks
jest.mock('@pokehub/frontend/dex-data-provider', () => ({
  usePokemonLearnset: jest.fn(),
  usePokemonMovesFromLearnset: jest.fn(),
  getMoveDetails: jest.fn(() => undefined),
}));

// Get mocked functions after the mock is set up
const {
  usePokemonLearnset: mockUsePokemonLearnset,
  usePokemonMovesFromLearnset: mockUsePokemonMovesFromLearnset,
} = jest.requireMock('@pokehub/frontend/dex-data-provider') as {
  usePokemonLearnset: jest.Mock;
  usePokemonMovesFromLearnset: jest.Mock;
};

const mockLearnsetData = {
  data: { thunder: {}, quickattack: {}, irontail: {}, thunderbolt: {} },
  isLoading: false,
};

const mockMovesData = {
  data: {
    Thunder: {
      name: 'Thunder',
      type: 'Electric',
      category: 'Special',
      basePower: 110,
      accuracy: 70,
      pp: 10,
      shortDesc: 'High power, low accuracy',
    },
    'Quick Attack': {
      name: 'Quick Attack',
      type: 'Normal',
      category: 'Physical',
      basePower: 40,
      accuracy: 100,
      pp: 30,
      shortDesc: 'Usually goes first',
    },
    'Iron Tail': {
      name: 'Iron Tail',
      type: 'Steel',
      category: 'Physical',
      basePower: 100,
      accuracy: 75,
      pp: 15,
      shortDesc: 'May lower Defense',
    },
    Thunderbolt: {
      name: 'Thunderbolt',
      type: 'Electric',
      category: 'Special',
      basePower: 90,
      accuracy: 100,
      pp: 15,
      shortDesc: 'May paralyze',
    },
    'Volt Tackle': {
      name: 'Volt Tackle',
      type: 'Electric',
      category: 'Physical',
      basePower: 120,
      accuracy: 100,
      pp: 15,
      shortDesc: 'Has recoil',
    },
  },
  isLoading: false,
};

// Mock SearchableSelect component
jest.mock('./searchable-select', () => ({
  SearchableSelect: ({
    label,
    value,
    onValueChange,
    onClear,
    isLoading,
  }: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    onClear?: () => void;
    isLoading?: boolean;
  }) => (
    <div
      data-testid={`searchable-select-${label
        .toLowerCase()
        .replace(/\s+/g, '-')}`}
    >
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        disabled={isLoading}
      />
      {onClear && (
        <button
          onClick={onClear}
          data-testid={`clear-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          Clear
        </button>
      )}
    </div>
  ),
}));

describe('MovesTab', () => {
  const mockPokemon: PokemonInTeam = {
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

  const mockSpecies = {
    id: 'pikachu',
    name: 'Pikachu',
    baseSpecies: 'Pikachu',
    types: ['Electric'],
    abilities: { 0: 'Static', H: 'Lightning Rod' },
  } as unknown as Species;

  const defaultProps: MovesTabProps = {
    pokemon: mockPokemon,
    species: mockSpecies,
  };

  // Helper to render MovesTab within Tabs wrapper
  const renderMovesTab = (props: MovesTabProps) => {
    return render(
      <Tabs defaultValue="moves">
        <MovesTab {...props} />
      </Tabs>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock return values
    mockUsePokemonLearnset.mockReturnValue(mockLearnsetData);
    mockUsePokemonMovesFromLearnset.mockReturnValue(mockMovesData);
  });

  describe('Rendering', () => {
    it('should render all 4 move slots', () => {
      renderMovesTab(defaultProps);

      expect(screen.getByText('Move 1')).toBeInTheDocument();
      expect(screen.getByText('Move 2')).toBeInTheDocument();
      expect(screen.getByText('Move 3')).toBeInTheDocument();
      expect(screen.getByText('Move 4')).toBeInTheDocument();
    });

    it('should render SearchableSelect for each move slot', () => {
      renderMovesTab(defaultProps);

      expect(
        screen.getByTestId('searchable-select-move-1')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('searchable-select-move-2')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('searchable-select-move-3')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('searchable-select-move-4')
      ).toBeInTheDocument();
    });

    it('should display current move values', () => {
      renderMovesTab(defaultProps);

      expect(
        (screen.getByTestId('input-move-1') as HTMLInputElement).value
      ).toBe('Thunder');
      expect(
        (screen.getByTestId('input-move-2') as HTMLInputElement).value
      ).toBe('Quick Attack');
      expect(
        (screen.getByTestId('input-move-3') as HTMLInputElement).value
      ).toBe('Iron Tail');
      expect(
        (screen.getByTestId('input-move-4') as HTMLInputElement).value
      ).toBe('Thunderbolt');
    });
  });

  describe('Move Selection', () => {
    it('should call setMove when move is changed', async () => {
      const user = userEvent.setup();
      renderMovesTab(defaultProps);

      const move1Input = screen.getByTestId('input-move-1');
      await user.clear(move1Input);
      await user.type(move1Input, 'Volt Tackle');

      expect(mockSetMove).toHaveBeenCalled();
    });

    it('should call setMove with correct slot index', async () => {
      const user = userEvent.setup();
      renderMovesTab(defaultProps);

      const move2Input = screen.getByTestId('input-move-2');
      await user.clear(move2Input);
      await user.type(move2Input, 'Volt Tackle');

      // Check that setMove was called with index 1
      const calls = mockSetMove.mock.calls;
      expect(calls.some((call) => call[0] === 1)).toBe(true);
    });

    it('should have clear button for all move slots', () => {
      renderMovesTab(defaultProps);

      expect(screen.getByTestId('clear-move-1')).toBeInTheDocument();
      expect(screen.getByTestId('clear-move-2')).toBeInTheDocument();
      expect(screen.getByTestId('clear-move-3')).toBeInTheDocument();
      expect(screen.getByTestId('clear-move-4')).toBeInTheDocument();
    });

    it('should call setMove with empty string when cleared', async () => {
      const user = userEvent.setup();
      renderMovesTab(defaultProps);

      const clearButton = screen.getByTestId('clear-move-1');
      await user.click(clearButton);

      expect(mockSetMove).toHaveBeenCalledWith(0, '');
    });
  });

  describe('Validation', () => {
    it('should not show validation alert when Pokemon has moves', () => {
      renderMovesTab(defaultProps);

      expect(
        screen.queryByText('Pokemon must have at least one move selected')
      ).not.toBeInTheDocument();
    });

    it('should show validation alert when Pokemon has no moves', () => {
      const propsWithNoMoves = {
        ...defaultProps,
        pokemon: {
          ...mockPokemon,
          moves: ['', '', '', ''] as PokemonInTeam['moves'],
        },
      };
      renderMovesTab(propsWithNoMoves);

      expect(
        screen.getByText('Pokemon must have at least one move selected')
      ).toBeInTheDocument();
    });

    it('should not show alert when Pokemon has at least one move', () => {
      const propsWithOneMove = {
        ...defaultProps,
        pokemon: {
          ...mockPokemon,
          moves: ['Thunder', '', '', ''] as PokemonInTeam['moves'],
        },
      };
      renderMovesTab(propsWithOneMove);

      expect(
        screen.queryByText('Pokemon must have at least one move selected')
      ).not.toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should call usePokemonLearnset with species id and generation', () => {
      renderMovesTab(defaultProps);

      expect(mockUsePokemonLearnset).toHaveBeenCalledWith('pikachu', {
        generation: 9,
      });
    });

    it('should call usePokemonMovesFromLearnset with correct params', () => {
      renderMovesTab(defaultProps);

      expect(mockUsePokemonMovesFromLearnset).toHaveBeenCalledWith(
        'pikachu',
        mockLearnsetData.data,
        { generation: 9 }
      );
    });
  });

  describe('Loading States', () => {
    it('should show loading state when learnset is loading', () => {
      mockUsePokemonLearnset.mockReturnValueOnce({
        data: null,
        isLoading: true,
      });

      renderMovesTab(defaultProps);

      const move1Input = screen.getByTestId('input-move-1') as HTMLInputElement;
      expect(move1Input.disabled).toBe(true);
    });

    it('should show loading state when moves are loading', () => {
      mockUsePokemonMovesFromLearnset.mockReturnValueOnce({
        data: null,
        isLoading: true,
      });

      renderMovesTab(defaultProps);

      const move1Input = screen.getByTestId('input-move-1') as HTMLInputElement;
      expect(move1Input.disabled).toBe(true);
    });

    it('should not be disabled when not loading', () => {
      renderMovesTab(defaultProps);

      const move1Input = screen.getByTestId('input-move-1') as HTMLInputElement;
      expect(move1Input.disabled).toBe(false);
    });
  });
});
