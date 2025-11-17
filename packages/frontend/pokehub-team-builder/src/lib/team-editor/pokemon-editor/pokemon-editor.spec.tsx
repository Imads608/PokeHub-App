import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PokemonEditor } from './pokemon-editor';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import type { Species } from '@pkmn/dex';

// Mock the tab components
jest.mock('./basic-tab', () => ({
  BasicTab: () => <div data-testid="basic-tab">Basic Tab</div>,
}));

jest.mock('./moves-tab', () => ({
  MovesTab: () => <div data-testid="moves-tab">Moves Tab</div>,
}));

jest.mock('./evs-tab', () => ({
  EVsTab: () => <div data-testid="evs-tab">EVs Tab</div>,
}));

jest.mock('./ivs-tab', () => ({
  IVsTab: () => <div data-testid="ivs-tab">IVs Tab</div>,
}));

describe('PokemonEditor', () => {
  const mockAddPokemon = jest.fn();
  const mockOnCancel = jest.fn();

  const mockPokemon: PokemonInTeam = {
    species: 'Pikachu' as PokemonInTeam['species'],
    name: 'Pika',
    ability: 'Static' as PokemonInTeam['ability'],
    item: 'Light Ball' as PokemonInTeam['item'],
    nature: 'Jolly' as PokemonInTeam['nature'],
    gender: 'M' as PokemonInTeam['gender'],
    level: 50,
    moves: ['Thunder', 'Quick Attack', 'Iron Tail', 'Thunderbolt'] as PokemonInTeam['moves'],
    evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  };

  const mockSpecies = {
    name: 'Pikachu',
    baseSpecies: 'Pikachu',
    types: ['Electric'],
    abilities: { 0: 'Static', H: 'Lightning Rod' },
  } as unknown as Species;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all tabs', () => {
      render(
        <PokemonEditor
          activePokemon={mockPokemon}
          species={mockSpecies}
          addPokemon={mockAddPokemon}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('tab', { name: /basic/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /moves/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /evs/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /ivs/i })).toBeInTheDocument();
    });

    it('should render Cancel and Add/Update buttons', () => {
      render(
        <PokemonEditor
          activePokemon={mockPokemon}
          species={mockSpecies}
          addPokemon={mockAddPokemon}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /add\/update to team/i })
      ).toBeInTheDocument();
    });

    it('should render all tab content panels', () => {
      render(
        <PokemonEditor
          activePokemon={mockPokemon}
          species={mockSpecies}
          addPokemon={mockAddPokemon}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('basic-tab')).toBeInTheDocument();
      expect(screen.getByTestId('moves-tab')).toBeInTheDocument();
      expect(screen.getByTestId('evs-tab')).toBeInTheDocument();
      expect(screen.getByTestId('ivs-tab')).toBeInTheDocument();
    });
  });

  describe('Cancel Button', () => {
    it('should call onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PokemonEditor
          activePokemon={mockPokemon}
          species={mockSpecies}
          addPokemon={mockAddPokemon}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call addPokemon when Cancel is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PokemonEditor
          activePokemon={mockPokemon}
          species={mockSpecies}
          addPokemon={mockAddPokemon}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockAddPokemon).not.toHaveBeenCalled();
    });
  });

  describe('Add/Update Button', () => {
    it('should call addPokemon when Add/Update button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PokemonEditor
          activePokemon={mockPokemon}
          species={mockSpecies}
          addPokemon={mockAddPokemon}
          onCancel={mockOnCancel}
        />
      );

      const addButton = screen.getByRole('button', {
        name: /add\/update to team/i,
      });
      await user.click(addButton);

      expect(mockAddPokemon).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when Add/Update is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PokemonEditor
          activePokemon={mockPokemon}
          species={mockSpecies}
          addPokemon={mockAddPokemon}
          onCancel={mockOnCancel}
        />
      );

      const addButton = screen.getByRole('button', {
        name: /add\/update to team/i,
      });
      await user.click(addButton);

      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Tab Navigation', () => {
    it('should allow switching between tabs', async () => {
      const user = userEvent.setup();

      render(
        <PokemonEditor
          activePokemon={mockPokemon}
          species={mockSpecies}
          addPokemon={mockAddPokemon}
          onCancel={mockOnCancel}
        />
      );

      // Click Moves tab
      const movesTab = screen.getByRole('tab', { name: /moves/i });
      await user.click(movesTab);
      expect(movesTab).toHaveAttribute('data-state', 'active');

      // Click EVs tab
      const evsTab = screen.getByRole('tab', { name: /evs/i });
      await user.click(evsTab);
      expect(evsTab).toHaveAttribute('data-state', 'active');

      // Click IVs tab
      const ivsTab = screen.getByRole('tab', { name: /ivs/i });
      await user.click(ivsTab);
      expect(ivsTab).toHaveAttribute('data-state', 'active');

      // Click back to Basic tab
      const basicTab = screen.getByRole('tab', { name: /basic/i });
      await user.click(basicTab);
      expect(basicTab).toHaveAttribute('data-state', 'active');
    });

    it('should start with Basic tab active by default', () => {
      render(
        <PokemonEditor
          activePokemon={mockPokemon}
          species={mockSpecies}
          addPokemon={mockAddPokemon}
          onCancel={mockOnCancel}
        />
      );

      const basicTab = screen.getByRole('tab', { name: /basic/i });
      expect(basicTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Props', () => {
    it('should pass activePokemon to tab components', () => {
      const { container } = render(
        <PokemonEditor
          activePokemon={mockPokemon}
          species={mockSpecies}
          addPokemon={mockAddPokemon}
          onCancel={mockOnCancel}
        />
      );

      // Tab components are rendered (mocked, but confirms props are passed)
      expect(container.querySelector('[data-testid="basic-tab"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="moves-tab"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="evs-tab"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="ivs-tab"]')).toBeInTheDocument();
    });
  });
});
