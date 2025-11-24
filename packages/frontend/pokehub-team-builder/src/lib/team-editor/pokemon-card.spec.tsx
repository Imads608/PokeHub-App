import { PokemonCard } from './pokemon-card';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Icons } from '@pkmn/img';

// Mock @pkmn/img
jest.mock('@pkmn/img');

// Mock data provider functions
jest.mock('@pokehub/frontend/dex-data-provider');

// Mock team editor context
const mockGetPokemonErrors = jest.fn(() => []);
jest.mock('../context/team-editor.context', () => ({
  useTeamEditorContext: () => ({
    validation: {
      getPokemonErrors: mockGetPokemonErrors,
    },
  }),
}));

const mockGetPokemon = jest.mocked(Icons.getPokemon);
const mockGetItem = jest.mocked(Icons.getItem);

// Get mocked dex-data-provider functions
const {
  getPokemonDetailsByName: mockGetPokemonDetailsByName,
  getAbilityDetails: mockGetAbilityDetails,
  getItemDetails: mockGetItemDetails,
  getMoveDetails: mockGetMoveDetails,
  getNatureDetails: mockGetNatureDetails,
  getStatName: mockGetStatName,
  getStats: mockGetStats,
} = jest.requireMock('@pokehub/frontend/dex-data-provider') as {
  getPokemonDetailsByName: jest.Mock;
  getAbilityDetails: jest.Mock;
  getItemDetails: jest.Mock;
  getMoveDetails: jest.Mock;
  getNatureDetails: jest.Mock;
  getStatName: jest.Mock;
  getStats: jest.Mock;
};

describe('PokemonCard', () => {
  const mockPokemon: PokemonInTeam = {
    species: 'Pikachu' as PokemonInTeam['species'],
    name: 'Pika',
    ability: 'Lightning Rod' as PokemonInTeam['ability'],
    item: 'Light Ball' as PokemonInTeam['item'],
    nature: 'Jolly' as PokemonInTeam['nature'],
    gender: 'M' as PokemonInTeam['gender'],
    level: 50,
    moves: ['Thunderbolt', 'Quick Attack', 'Iron Tail', 'Volt Tackle'] as PokemonInTeam['moves'],
    evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  };

  const defaultProps = {
    pokemon: mockPokemon,
    generation: 9 as const,
    onRemove: jest.fn(),
    onEdit: jest.fn(),
    onEditHover: jest.fn(),
    isPokemonEditorOpen: false,
    index: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup @pkmn/img mocks
    mockGetPokemon.mockImplementation((species: string) => ({
      css: { backgroundImage: `url(pokemon-${species}.png)` },
    }));
    mockGetItem.mockImplementation((item: string) => ({
      css: { backgroundImage: `url(item-${item}.png)` },
    }));

    // Setup data provider mocks
    mockGetPokemonDetailsByName.mockReturnValue({
      id: 'pikachu',
      name: 'Pikachu',
      types: ['Electric'],
    });

    mockGetAbilityDetails.mockReturnValue({
      desc: 'Boosts Attack when hit by Electric-type moves.',
    });

    mockGetItemDetails.mockReturnValue({
      desc: 'Doubles Attack for Pikachu.',
    });

    mockGetMoveDetails.mockReturnValue({
      type: 'Electric',
      basePower: 90,
      accuracy: 100,
      pp: 15,
      desc: 'May paralyze the foe.',
    });

    mockGetNatureDetails.mockReturnValue({
      desc: '+Speed, -Sp. Atk',
      plus: 'spe',
      minus: 'spa',
    });

    mockGetStatName.mockImplementation((statId: string) => {
      const names: Record<string, string> = {
        hp: 'HP',
        atk: 'Attack',
        def: 'Defense',
        spa: 'Sp. Atk',
        spd: 'Sp. Def',
        spe: 'Speed',
      };
      return names[statId] || statId;
    });

    mockGetStats.mockReturnValue(['hp', 'atk', 'def', 'spa', 'spd', 'spe']);

    // Reset getPokemonSlotErrors to return empty array by default
    mockGetPokemonErrors.mockReturnValue([]);
  });

  describe('Rendering', () => {
    it('should render Pokemon name', () => {
      render(<PokemonCard {...defaultProps} />);

      expect(screen.getByText('Pika')).toBeInTheDocument();
    });

    it('should render species name when name is not provided', () => {
      const propsWithoutName = {
        ...defaultProps,
        pokemon: { ...mockPokemon, name: '' },
      };
      render(<PokemonCard {...propsWithoutName} />);

      expect(screen.getByText('Pikachu')).toBeInTheDocument();
    });

    it('should render Pokemon level', () => {
      render(<PokemonCard {...defaultProps} />);

      expect(screen.getByText('Lv.50')).toBeInTheDocument();
    });

    it('should render type badges', () => {
      render(<PokemonCard {...defaultProps} />);

      expect(screen.getByText('Electric')).toBeInTheDocument();
    });

    it('should render ability name', () => {
      render(<PokemonCard {...defaultProps} />);

      expect(screen.getByText('Lightning Rod')).toBeInTheDocument();
    });

    it('should render "None" when no ability', () => {
      const propsWithoutAbility = {
        ...defaultProps,
        pokemon: { ...mockPokemon, ability: '' as PokemonInTeam['ability'] },
      };
      render(<PokemonCard {...propsWithoutAbility} />);

      const abilitySection = screen.getByText('Ability').parentElement;
      expect(abilitySection).toHaveTextContent('None');
    });

    it('should render item name', () => {
      render(<PokemonCard {...defaultProps} />);

      expect(screen.getByText('Light Ball')).toBeInTheDocument();
    });

    it('should render "None" when no item', () => {
      const propsWithoutItem = {
        ...defaultProps,
        pokemon: { ...mockPokemon, item: '' as PokemonInTeam['item'] },
      };
      render(<PokemonCard {...propsWithoutItem} />);

      const itemSection = screen.getByText('Item').parentElement;
      expect(itemSection).toHaveTextContent('None');
    });

    it('should render all 4 move slots', () => {
      render(<PokemonCard {...defaultProps} />);

      expect(screen.getByText('Move 1')).toBeInTheDocument();
      expect(screen.getByText('Move 2')).toBeInTheDocument();
      expect(screen.getByText('Move 3')).toBeInTheDocument();
      expect(screen.getByText('Move 4')).toBeInTheDocument();
    });

    it('should render move names', () => {
      render(<PokemonCard {...defaultProps} />);

      expect(screen.getByText('Thunderbolt')).toBeInTheDocument();
      expect(screen.getByText('Quick Attack')).toBeInTheDocument();
      expect(screen.getByText('Iron Tail')).toBeInTheDocument();
      expect(screen.getByText('Volt Tackle')).toBeInTheDocument();
    });

    it('should render empty move slots', () => {
      const propsWithEmptyMoves = {
        ...defaultProps,
        pokemon: {
          ...mockPokemon,
          moves: ['Thunderbolt', '', '', ''] as PokemonInTeam['moves'],
        },
      };
      render(<PokemonCard {...propsWithEmptyMoves} />);

      expect(screen.getByText('Thunderbolt')).toBeInTheDocument();
      // Empty move slots should just be empty divs
      const moveSlots = screen.getAllByText(/Move \d/);
      expect(moveSlots.length).toBe(4);
    });
  });

  describe('Action Buttons', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();
      render(<PokemonCard {...defaultProps} onEdit={onEdit} />);

      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find((btn) => btn.querySelector('svg.lucide-square-pen'));

      if (editButton) {
        await user.click(editButton);
      }

      expect(onEdit).toHaveBeenCalled();
    });

    it('should call onEditHover when edit button is hovered', async () => {
      const user = userEvent.setup();
      const onEditHover = jest.fn();
      render(<PokemonCard {...defaultProps} onEditHover={onEditHover} />);

      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find((btn) => btn.querySelector('svg.lucide-square-pen'));

      if (editButton) {
        await user.hover(editButton);
      }

      expect(onEditHover).toHaveBeenCalled();
    });

    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      render(<PokemonCard {...defaultProps} onRemove={onRemove} />);

      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find((btn) => btn.querySelector('svg.lucide-trash-2'));

      if (removeButton) {
        await user.click(removeButton);
      }

      expect(onRemove).toHaveBeenCalled();
    });
  });

  describe('Expand/Collapse', () => {
    it('should not show expanded content by default', () => {
      render(<PokemonCard {...defaultProps} />);

      expect(screen.queryByText('Nature')).not.toBeInTheDocument();
      expect(screen.queryByText('Stats')).not.toBeInTheDocument();
    });

    it('should show ChevronDown icon when collapsed', () => {
      render(<PokemonCard {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const expandButton = buttons.find((btn) => btn.querySelector('svg.lucide-chevron-down'));

      expect(expandButton).toBeInTheDocument();
    });

    it('should expand when chevron button is clicked', async () => {
      const user = userEvent.setup();
      render(<PokemonCard {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const expandButton = buttons.find((btn) => btn.querySelector('svg.lucide-chevron-down'));

      if (expandButton) {
        await user.click(expandButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Nature')).toBeInTheDocument();
        expect(screen.getByText('Stats')).toBeInTheDocument();
      });
    });

    it('should show ChevronUp icon when expanded', async () => {
      const user = userEvent.setup();
      render(<PokemonCard {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const expandButton = buttons.find((btn) => btn.querySelector('svg.lucide-chevron-down'));

      if (expandButton) {
        await user.click(expandButton);
      }

      await waitFor(() => {
        const upButtons = screen.getAllByRole('button');
        const chevronUpButton = upButtons.find((btn) => btn.querySelector('svg.lucide-chevron-up'));
        expect(chevronUpButton).toBeInTheDocument();
      });
    });

    it('should collapse when chevron button is clicked again', async () => {
      const user = userEvent.setup();
      render(<PokemonCard {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const expandButton = buttons.find((btn) => btn.querySelector('svg.lucide-chevron-down'));

      if (expandButton) {
        await user.click(expandButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Nature')).toBeInTheDocument();
      });

      const upButtons = screen.getAllByRole('button');
      const collapseButton = upButtons.find((btn) => btn.querySelector('svg.lucide-chevron-up'));

      if (collapseButton) {
        await user.click(collapseButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('Nature')).not.toBeInTheDocument();
      });
    });
  });

  describe('Expanded Content', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<PokemonCard {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const expandButton = buttons.find((btn) => btn.querySelector('svg.lucide-chevron-down'));

      if (expandButton) {
        await user.click(expandButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Nature')).toBeInTheDocument();
      });
    });

    it('should display nature name', () => {
      expect(screen.getByText('Jolly')).toBeInTheDocument();
    });

    it('should display all stat names', () => {
      expect(screen.getByText('HP')).toBeInTheDocument();
      expect(screen.getByText('Attack')).toBeInTheDocument();
      expect(screen.getByText('Defense')).toBeInTheDocument();
      expect(screen.getByText('Sp. Atk')).toBeInTheDocument();
      expect(screen.getByText('Sp. Def')).toBeInTheDocument();
      expect(screen.getByText('Speed')).toBeInTheDocument();
    });

    it('should display EV values', () => {
      // Should show 252 for Attack and Speed, 4 for Sp. Def
      const evValues = screen.getAllByText('252');
      expect(evValues.length).toBeGreaterThanOrEqual(2);

      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should display nature boost indicator', () => {
      // Jolly boosts Speed (+)
      const speedSection = screen.getByText('Speed').parentElement;
      expect(speedSection?.textContent).toContain('↑');
    });

    it('should display nature reduction indicator', () => {
      // Jolly reduces Sp. Atk (-)
      const spAtkSection = screen.getByText('Sp. Atk').parentElement;
      expect(spAtkSection?.textContent).toContain('↓');
    });
  });

  describe('Validation Errors', () => {
    it('should not show error icon when no errors', () => {
      const { container } = render(<PokemonCard {...defaultProps} />);

      const alertIcon = container.querySelector('svg.lucide-alert-circle');
      expect(alertIcon).not.toBeInTheDocument();
    });

    it('should show error icon when there are validation errors', () => {
      mockGetPokemonErrors.mockReturnValue([
        { message: 'Pokemon must have at least one move', path: 'moves' },
      ]);

      const { container } = render(<PokemonCard {...defaultProps} />);

      // Check that errors are detected by looking for border-destructive
      const card = container.querySelector('.border-destructive');
      expect(card).toBeInTheDocument();

      // The alert icon should be rendered (as a sibling of the Pokemon name)
      const alertIcon = container.querySelector('.text-destructive');
      expect(alertIcon).toBeInTheDocument();
    });

    it('should show red border when there are validation errors', () => {
      mockGetPokemonErrors.mockReturnValue([
        { message: 'Pokemon must have at least one move', path: 'moves' },
      ]);

      const { container } = render(<PokemonCard {...defaultProps} />);

      // Card should have border-destructive class
      const card = container.querySelector('.border-destructive');
      expect(card).toBeInTheDocument();
    });

    it('should display error messages in tooltip', async () => {
      mockGetPokemonErrors.mockReturnValue([
        { message: 'Pokemon must have at least one move', path: 'moves' },
        { message: 'Invalid ability for this Pokemon', path: 'ability' },
      ]);

      const user = userEvent.setup();
      const { container } = render(<PokemonCard {...defaultProps} />);

      const alertIcon = container.querySelector('.text-destructive');
      if (alertIcon) {
        await user.hover(alertIcon);
      }

      await waitFor(() => {
        expect(screen.getAllByText('Validation Errors:').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Pokemon must have at least one move').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Invalid ability for this Pokemon').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Icons', () => {
    it('should call getPokemon with species name', () => {
      render(<PokemonCard {...defaultProps} />);

      expect(mockGetPokemon).toHaveBeenCalledWith('Pikachu');
    });

    it('should call getItem with item name when item exists', () => {
      render(<PokemonCard {...defaultProps} />);

      expect(mockGetItem).toHaveBeenCalledWith('Light Ball');
    });

    it('should not call getItem when item is empty', () => {
      mockGetItem.mockClear();
      const propsWithoutItem = {
        ...defaultProps,
        pokemon: { ...mockPokemon, item: '' as PokemonInTeam['item'] },
      };
      render(<PokemonCard {...propsWithoutItem} />);

      expect(mockGetItem).not.toHaveBeenCalled();
    });
  });

  describe('Updates on Editor Open', () => {
    it('should update moves when Pokemon Editor opens and moves change', () => {
      const { rerender } = render(<PokemonCard {...defaultProps} />);

      const newProps = {
        ...defaultProps,
        isPokemonEditorOpen: true,
        pokemon: {
          ...mockPokemon,
          moves: ['Thunder', 'Volt Tackle', '', ''] as PokemonInTeam['moves'],
        },
      };

      rerender(<PokemonCard {...newProps} />);

      expect(screen.getByText('Thunder')).toBeInTheDocument();
      expect(screen.getByText('Volt Tackle')).toBeInTheDocument();
    });

    it('should not update when editor is closed', () => {
      mockGetMoveDetails.mockClear();

      const { rerender } = render(<PokemonCard {...defaultProps} />);

      const newProps = {
        ...defaultProps,
        isPokemonEditorOpen: false,
        pokemon: {
          ...mockPokemon,
          moves: ['Thunder', 'Volt Tackle', '', ''] as PokemonInTeam['moves'],
        },
      };

      rerender(<PokemonCard {...newProps} />);

      // getMoveDetails should not be called for new moves since editor is closed
      // (it's only called during useEffect when isPokemonEditorOpen is true)
      const callCount = mockGetMoveDetails.mock.calls.length;

      // Re-render again with editor open
      rerender(<PokemonCard {...{ ...newProps, isPokemonEditorOpen: true }} />);

      // Now it should be called
      expect(mockGetMoveDetails.mock.calls.length).toBeGreaterThan(callCount);
    });
  });
});
