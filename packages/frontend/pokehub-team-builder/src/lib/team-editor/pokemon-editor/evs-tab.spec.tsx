import { EVsTab, type EVsTabProps } from './evs-tab';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import { Tabs } from '@pokehub/frontend/shared-ui-components';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock context
const mockSetEV = jest.fn();

jest.mock('../../context/team-editor.context', () => ({
  useTeamEditorContext: () => ({
    activePokemon: {
      setEV: mockSetEV,
    },
    generation: { value: 9 },
  }),
}));

// Mock data provider functions
jest.mock('@pokehub/frontend/dex-data-provider', () => ({
  getStats: jest.fn((generation: number) => [
    'hp',
    'atk',
    'def',
    'spa',
    'spd',
    'spe',
  ]),
  getStatName: jest.fn((statId: string, generation: number) => {
    const names: Record<string, string> = {
      hp: 'HP',
      atk: 'Attack',
      def: 'Defense',
      spa: 'Sp. Atk',
      spd: 'Sp. Def',
      spe: 'Speed',
    };
    return names[statId] || statId;
  }),
}));

// Get references to mocked functions
const { getStats, getStatName } = jest.requireMock('@pokehub/frontend/dex-data-provider') as {
  getStats: jest.Mock;
  getStatName: jest.Mock;
};

describe('EVsTab', () => {
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

  const defaultProps: EVsTabProps = {
    pokemon: mockPokemon,
  };

  // Helper to render EVsTab within Tabs wrapper
  const renderEVsTab = (props: EVsTabProps) => {
    return render(
      <Tabs defaultValue="evs">
        <EVsTab {...props} />
      </Tabs>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all 6 stat inputs', () => {
      renderEVsTab(defaultProps);

      expect(screen.getByText('HP')).toBeInTheDocument();
      expect(screen.getByText('Attack')).toBeInTheDocument();
      expect(screen.getByText('Defense')).toBeInTheDocument();
      expect(screen.getByText('Sp. Atk')).toBeInTheDocument();
      expect(screen.getByText('Sp. Def')).toBeInTheDocument();
      expect(screen.getByText('Speed')).toBeInTheDocument();
    });

    it('should display EV Distribution header', () => {
      renderEVsTab(defaultProps);

      expect(screen.getByText('EV Distribution')).toBeInTheDocument();
    });

    it('should display total EV count', () => {
      renderEVsTab(defaultProps);

      // Total: 0 + 252 + 0 + 0 + 4 + 252 = 508
      expect(screen.getByText('508/510')).toBeInTheDocument();
    });

    it('should display individual stat counts', () => {
      renderEVsTab(defaultProps);

      // Check for unique values
      expect(screen.getAllByText('0/252').length).toBeGreaterThan(0); // HP, Defense, Sp. Atk
      expect(screen.getAllByText('252/252').length).toBe(2); // Attack and Speed
      expect(screen.getByText('4/252')).toBeInTheDocument(); // Sp. Def (unique)
    });

    it('should render progress bar', () => {
      renderEVsTab(defaultProps);

      // Progress bar should exist in the document
      const progressBar = document.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('EV Values', () => {
    it('should display current EV values in inputs', () => {
      renderEVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');

      // Find inputs by their value
      const hpInput = inputs.find((input) => (input as HTMLInputElement).value === '0');
      const atkInput = inputs.find((input) => (input as HTMLInputElement).value === '252');
      const spdInput = inputs.find((input) => (input as HTMLInputElement).value === '4');

      expect(hpInput).toBeDefined();
      expect(atkInput).toBeDefined();
      expect(spdInput).toBeDefined();
    });

    it('should have min value of 0', () => {
      renderEVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('min', '0');
      });
    });

    it('should have max value of 252', () => {
      renderEVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('max', '252');
      });
    });

    it('should have step of 4', () => {
      renderEVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('step', '4');
      });
    });
  });

  describe('User Interactions', () => {
    it('should call setEV when input value changes', async () => {
      const user = userEvent.setup();
      renderEVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');
      const hpInput = inputs.find((input) => (input as HTMLInputElement).value === '0');

      if (hpInput) {
        await user.clear(hpInput);
        await user.type(hpInput, '100');

        expect(mockSetEV).toHaveBeenCalled();
      }
    });

    it('should call setEV with correct stat id', async () => {
      const user = userEvent.setup();
      renderEVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');
      const hpInput = inputs.find((input) => (input as HTMLInputElement).value === '0');

      if (hpInput) {
        await user.clear(hpInput);
        await user.type(hpInput, '100');

        // Check that setEV was called with 'hp'
        const calls = mockSetEV.mock.calls;
        expect(calls.some((call) => call[0] === 'hp')).toBe(true);
      }
    });
  });

  describe('Total EV Calculation', () => {
    it('should correctly calculate total EVs when at 0', () => {
      const propsWithZeroEVs = {
        pokemon: {
          ...mockPokemon,
          evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        },
      };
      renderEVsTab(propsWithZeroEVs);

      expect(screen.getByText('0/510')).toBeInTheDocument();
    });

    it('should correctly calculate total EVs when at max (510)', () => {
      const propsWithMaxEVs = {
        pokemon: {
          ...mockPokemon,
          evs: { hp: 252, atk: 252, def: 4, spa: 0, spd: 2, spe: 0 },
        },
      };
      renderEVsTab(propsWithMaxEVs);

      expect(screen.getByText('510/510')).toBeInTheDocument();
    });

    it('should correctly calculate partial EV totals', () => {
      const propsWithPartialEVs = {
        pokemon: {
          ...mockPokemon,
          evs: { hp: 100, atk: 100, def: 100, spa: 0, spd: 0, spe: 0 },
        },
      };
      renderEVsTab(propsWithPartialEVs);

      expect(screen.getByText('300/510')).toBeInTheDocument();
    });
  });

  describe('Generation Support', () => {
    it('should call getStats with current generation', () => {
      renderEVsTab(defaultProps);

      expect(getStats).toHaveBeenCalledWith(9);
    });

    it('should call getStatName for each stat', () => {
      renderEVsTab(defaultProps);

      expect(getStatName).toHaveBeenCalledWith('hp', 9);
      expect(getStatName).toHaveBeenCalledWith('atk', 9);
      expect(getStatName).toHaveBeenCalledWith('def', 9);
      expect(getStatName).toHaveBeenCalledWith('spa', 9);
      expect(getStatName).toHaveBeenCalledWith('spd', 9);
      expect(getStatName).toHaveBeenCalledWith('spe', 9);
    });

    it('should filter out stats that do not exist in generation', () => {
      // Mock getStatName to return bracketed name for non-existent stat
      (getStatName as jest.Mock).mockImplementation((statId: string) => {
        if (statId === 'spa') return '[Special]';
        const names: Record<string, string> = {
          hp: 'HP',
          atk: 'Attack',
          def: 'Defense',
          spd: 'Sp. Def',
          spe: 'Speed',
        };
        return names[statId] || statId;
      });

      renderEVsTab(defaultProps);

      // Should not render the Special stat
      expect(screen.queryByText('[Special]')).not.toBeInTheDocument();

      // Should render other stats
      expect(screen.getByText('HP')).toBeInTheDocument();
      expect(screen.getByText('Attack')).toBeInTheDocument();
    });
  });
});
