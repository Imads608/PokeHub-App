import { IVsTab, type IVsTabProps } from './ivs-tab';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import { Tabs } from '@pokehub/frontend/shared-ui-components';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock context
const mockSetIV = jest.fn();
const mockSetValue = jest.fn();
const mockActivePokemon: PokemonInTeam = {
  species: 'Pikachu' as PokemonInTeam['species'],
  name: 'Pika',
  ability: 'Static' as PokemonInTeam['ability'],
  item: 'Light Ball' as PokemonInTeam['item'],
  nature: 'Jolly' as PokemonInTeam['nature'],
  gender: 'M' as PokemonInTeam['gender'],
  level: 50,
  moves: ['Thunder', 'Quick Attack', 'Iron Tail', 'Thunderbolt'] as PokemonInTeam['moves'],
  evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 0 },
};

jest.mock('../../context/team-editor.context', () => ({
  useTeamEditorContext: () => ({
    activePokemon: {
      setIV: mockSetIV,
      setValue: mockSetValue,
      value: mockActivePokemon,
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

describe('IVsTab', () => {
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
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 0 },
  };

  const defaultProps: IVsTabProps = {
    pokemon: mockPokemon,
  };

  // Helper to render IVsTab within Tabs wrapper
  const renderIVsTab = (props: IVsTabProps) => {
    return render(
      <Tabs defaultValue="ivs">
        <IVsTab {...props} />
      </Tabs>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all 6 stat inputs', () => {
      renderIVsTab(defaultProps);

      expect(screen.getByText('HP')).toBeInTheDocument();
      expect(screen.getByText('Attack')).toBeInTheDocument();
      expect(screen.getByText('Defense')).toBeInTheDocument();
      expect(screen.getByText('Sp. Atk')).toBeInTheDocument();
      expect(screen.getByText('Sp. Def')).toBeInTheDocument();
      expect(screen.getByText('Speed')).toBeInTheDocument();
    });

    it('should display individual stat counts', () => {
      renderIVsTab(defaultProps);

      // Most stats are 31/31, Speed is 0/31
      expect(screen.getAllByText('31/31').length).toBe(5); // HP, Attack, Defense, Sp. Atk, Sp. Def
      expect(screen.getByText('0/31')).toBeInTheDocument(); // Speed
    });

    it('should render Max All button', () => {
      renderIVsTab(defaultProps);

      expect(screen.getByRole('button', { name: /max all/i })).toBeInTheDocument();
    });

    it('should render Trick Room button', () => {
      renderIVsTab(defaultProps);

      expect(screen.getByRole('button', { name: /trick room/i })).toBeInTheDocument();
    });
  });

  describe('IV Values', () => {
    it('should display current IV values in inputs', () => {
      renderIVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');

      // Find inputs by their value
      const maxIVInputs = inputs.filter((input) => (input as HTMLInputElement).value === '31');
      const speedInput = inputs.find((input) => (input as HTMLInputElement).value === '0');

      expect(maxIVInputs.length).toBe(5); // HP, Attack, Defense, Sp. Atk, Sp. Def
      expect(speedInput).toBeDefined();
    });

    it('should have min value of 0', () => {
      renderIVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('min', '0');
      });
    });

    it('should have max value of 31', () => {
      renderIVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('max', '31');
      });
    });

    it('should have step of 1', () => {
      renderIVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('step', '1');
      });
    });
  });

  describe('User Interactions', () => {
    it('should call setIV when input value changes', async () => {
      const user = userEvent.setup();
      renderIVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');
      const speedInput = inputs.find((input) => (input as HTMLInputElement).value === '0');

      if (speedInput) {
        await user.clear(speedInput);
        await user.type(speedInput, '15');

        expect(mockSetIV).toHaveBeenCalled();
      }
    });

    it('should call setIV with correct stat id', async () => {
      const user = userEvent.setup();
      renderIVsTab(defaultProps);

      const inputs = screen.getAllByRole('spinbutton');
      const speedInput = inputs.find((input) => (input as HTMLInputElement).value === '0');

      if (speedInput) {
        await user.clear(speedInput);
        await user.type(speedInput, '15');

        // Check that setIV was called with 'spe'
        const calls = mockSetIV.mock.calls;
        expect(calls.some((call) => call[0] === 'spe')).toBe(true);
      }
    });
  });

  describe('Preset Buttons', () => {
    describe('Max All', () => {
      it('should call setValue when Max All is clicked', async () => {
        const user = userEvent.setup();
        renderIVsTab(defaultProps);

        const maxAllButton = screen.getByRole('button', { name: /max all/i });
        await user.click(maxAllButton);

        expect(mockSetValue).toHaveBeenCalled();
      });

      it('should set all IVs to 31 when Max All is clicked', async () => {
        const user = userEvent.setup();
        renderIVsTab(defaultProps);

        const maxAllButton = screen.getByRole('button', { name: /max all/i });
        await user.click(maxAllButton);

        const call = mockSetValue.mock.calls[0][0];
        expect(call.ivs).toEqual({
          hp: 31,
          atk: 31,
          def: 31,
          spa: 31,
          spd: 31,
          spe: 31,
        });
      });

      it('should preserve other Pokemon properties when Max All is clicked', async () => {
        const user = userEvent.setup();
        renderIVsTab(defaultProps);

        const maxAllButton = screen.getByRole('button', { name: /max all/i });
        await user.click(maxAllButton);

        const call = mockSetValue.mock.calls[0][0];
        expect(call.species).toBe('Pikachu');
        expect(call.name).toBe('Pika');
        expect(call.level).toBe(50);
      });
    });

    describe('Trick Room', () => {
      it('should call setValue when Trick Room is clicked', async () => {
        const user = userEvent.setup();
        renderIVsTab(defaultProps);

        const trickRoomButton = screen.getByRole('button', { name: /trick room/i });
        await user.click(trickRoomButton);

        expect(mockSetValue).toHaveBeenCalled();
      });

      it('should set Speed to 0 and others to 31 when Trick Room is clicked', async () => {
        const user = userEvent.setup();
        renderIVsTab(defaultProps);

        const trickRoomButton = screen.getByRole('button', { name: /trick room/i });
        await user.click(trickRoomButton);

        const call = mockSetValue.mock.calls[0][0];
        expect(call.ivs).toEqual({
          hp: 31,
          atk: 31,
          def: 31,
          spa: 31,
          spd: 31,
          spe: 0,
        });
      });

      it('should preserve other Pokemon properties when Trick Room is clicked', async () => {
        const user = userEvent.setup();
        renderIVsTab(defaultProps);

        const trickRoomButton = screen.getByRole('button', { name: /trick room/i });
        await user.click(trickRoomButton);

        const call = mockSetValue.mock.calls[0][0];
        expect(call.species).toBe('Pikachu');
        expect(call.name).toBe('Pika');
        expect(call.level).toBe(50);
      });
    });
  });

  describe('Generation Support', () => {
    it('should call getStats with current generation', () => {
      renderIVsTab(defaultProps);

      expect(getStats).toHaveBeenCalledWith(9);
    });

    it('should call getStatName for each stat', () => {
      renderIVsTab(defaultProps);

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

      renderIVsTab(defaultProps);

      // Should not render the Special stat
      expect(screen.queryByText('[Special]')).not.toBeInTheDocument();

      // Should render other stats
      expect(screen.getByText('HP')).toBeInTheDocument();
      expect(screen.getByText('Attack')).toBeInTheDocument();
    });
  });
});
