import { BasicTab, type BasicTabProps } from './basic-tab';
import type { Species } from '@pkmn/dex';
import { Tabs } from '@pokehub/frontend/shared-ui-components';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock context
const mockSetLevel = jest.fn();
const mockSetName = jest.fn();
const mockSetAbility = jest.fn();
const mockSetItem = jest.fn();
const mockSetNature = jest.fn();

jest.mock('../../context/team-editor-context/team-editor.context', () => ({
  useTeamEditorContext: () => ({
    activePokemon: {
      setLevel: mockSetLevel,
      setName: mockSetName,
      setAbility: mockSetAbility,
      setItem: mockSetItem,
      setNature: mockSetNature,
    },
    generation: { value: 9 },
    validation: {
      showdownFormatId: 'gen9ou',
    },
  }),
}));

// Mock data providers
jest.mock('@pokehub/frontend/dex-data-provider', () => ({
  getItems: jest.fn(() => [
    {
      name: 'Light Ball',
      exists: true,
      desc: "Boosts Pikachu's Attack and Sp. Atk",
    },
    {
      name: 'Choice Band',
      exists: true,
      desc: 'Boosts Attack, but allows only one move',
    },
    { name: 'Leftovers', exists: true, desc: 'Restores HP every turn' },
  ]),
  getAbilityDetails: jest.fn(() => undefined),
  getItemDetails: jest.fn(() => undefined),
  getNatures: jest.fn(() => [
    { name: 'Jolly', plus: 'spe', minus: 'spa' },
    { name: 'Adamant', plus: 'atk', minus: 'spa' },
    { name: 'Modest', plus: 'spa', minus: 'atk' },
  ]),
  getNatureDescription: jest.fn((nature: string) => {
    const descriptions: Record<string, string> = {
      Jolly: '+Speed, -Sp. Atk',
      Adamant: '+Attack, -Sp. Atk',
      Modest: '+Sp. Atk, -Attack',
    };
    return descriptions[nature] || '';
  }),
  getPokemonAbilitiesDetailsFromSpecies: jest.fn(() => [
    { id: 'static', name: 'Static', desc: 'May paralyze on contact' },
    {
      id: 'lightningrod',
      name: 'Lightning Rod',
      desc: 'Draws in Electric moves',
    },
  ]),
}));

// Get references to mocked functions
const { getItems, getNatures, getPokemonAbilitiesDetailsFromSpecies } =
  jest.requireMock('@pokehub/frontend/dex-data-provider') as {
    getItems: jest.Mock;
    getNatures: jest.Mock;
    getPokemonAbilitiesDetailsFromSpecies: jest.Mock;
  };

// Mock @pkmn/img
jest.mock('@pkmn/img', () => ({
  Icons: {
    getItem: jest.fn(() => ({
      css: {
        backgroundImage: 'url(item-sprite.png)',
      },
    })),
  },
}));

// Mock SearchableSelect component
jest.mock('./searchable-select', () => ({
  SearchableSelect: ({
    label,
    value,
    onValueChange,
    onClear,
  }: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    onClear?: () => void;
  }) => (
    <div data-testid={`searchable-select-${label.toLowerCase()}`}>
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-testid={`input-${label.toLowerCase()}`}
      />
      {onClear && (
        <button onClick={onClear} data-testid={`clear-${label.toLowerCase()}`}>
          Clear
        </button>
      )}
    </div>
  ),
}));

describe('BasicTab', () => {
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
    name: 'Pikachu',
    baseSpecies: 'Pikachu',
    types: ['Electric'],
    abilities: { 0: 'Static', H: 'Lightning Rod' },
  } as unknown as Species;

  const defaultProps: BasicTabProps = {
    pokemon: mockPokemon,
    species: mockSpecies,
  };

  // Helper to render BasicTab within Tabs wrapper
  const renderBasicTab = (props: BasicTabProps) => {
    return render(
      <Tabs defaultValue="basic">
        <BasicTab {...props} />
      </Tabs>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      renderBasicTab(defaultProps);

      expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
      expect(screen.getByText('Level')).toBeInTheDocument();
      expect(screen.getByLabelText(/ability/i)).toBeInTheDocument();
      expect(screen.getByTestId('searchable-select-item')).toBeInTheDocument();
      expect(
        screen.getByTestId('searchable-select-nature')
      ).toBeInTheDocument();
    });

    it('should display current Pokemon values', () => {
      renderBasicTab(defaultProps);

      const nicknameInput = screen.getByLabelText(
        /nickname/i
      ) as HTMLInputElement;
      expect(nicknameInput.value).toBe('Pika');

      expect(screen.getByText('50')).toBeInTheDocument(); // Level display
    });

    it('should display Pokemon species as nickname placeholder', () => {
      renderBasicTab(defaultProps);

      const nicknameInput = screen.getByLabelText(
        /nickname/i
      ) as HTMLInputElement;
      expect(nicknameInput.placeholder).toBe('Pikachu');
    });
  });

  describe('Nickname Input', () => {
    it('should call setName when nickname is changed', async () => {
      const user = userEvent.setup();
      renderBasicTab(defaultProps);

      const nicknameInput = screen.getByLabelText(/nickname/i);
      await user.clear(nicknameInput);
      await user.type(nicknameInput, 'Sparky');

      // setName should be called multiple times (clear + each character typed)
      expect(mockSetName).toHaveBeenCalled();
      expect(mockSetName.mock.calls.length).toBeGreaterThan(1);
    });

    it('should allow clearing the nickname', async () => {
      const user = userEvent.setup();
      renderBasicTab(defaultProps);

      const nicknameInput = screen.getByLabelText(/nickname/i);
      await user.clear(nicknameInput);

      expect(mockSetName).toHaveBeenCalledWith('');
    });
  });

  describe('Level Slider', () => {
    it('should display current level', () => {
      renderBasicTab(defaultProps);

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should display level 1 for level 1 Pokemon', () => {
      const props = {
        ...defaultProps,
        pokemon: { ...mockPokemon, level: 1 },
      };
      renderBasicTab(props);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display level 100 for level 100 Pokemon', () => {
      const props = {
        ...defaultProps,
        pokemon: { ...mockPokemon, level: 100 },
      };
      renderBasicTab(props);

      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Ability Select', () => {
    it('should display current ability', () => {
      renderBasicTab(defaultProps);

      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    it('should call setAbility on mount with first ability', () => {
      renderBasicTab(defaultProps);

      expect(mockSetAbility).toHaveBeenCalledWith('Static');
    });

    it('should show placeholder when no ability selected', () => {
      const props = {
        ...defaultProps,
        pokemon: { ...mockPokemon, ability: '' as PokemonInTeam['ability'] },
      };
      renderBasicTab(props);

      expect(screen.getByText('Select ability')).toBeInTheDocument();
    });
  });

  describe('Item SearchableSelect', () => {
    it('should render Item searchable select', () => {
      renderBasicTab(defaultProps);

      expect(screen.getByTestId('searchable-select-item')).toBeInTheDocument();
    });

    it('should pass current item value', () => {
      renderBasicTab(defaultProps);

      const itemInput = screen.getByTestId('input-item') as HTMLInputElement;
      expect(itemInput.value).toBe('Light Ball');
    });

    it('should call setItem when item is changed', async () => {
      const user = userEvent.setup();
      renderBasicTab(defaultProps);

      const itemInput = screen.getByTestId('input-item');
      await user.clear(itemInput);
      await user.type(itemInput, 'Choice Band');

      expect(mockSetItem).toHaveBeenCalled();
    });

    it('should have clear button for item', () => {
      renderBasicTab(defaultProps);

      expect(screen.getByTestId('clear-item')).toBeInTheDocument();
    });
  });

  describe('Nature SearchableSelect', () => {
    it('should render Nature searchable select', () => {
      renderBasicTab(defaultProps);

      expect(
        screen.getByTestId('searchable-select-nature')
      ).toBeInTheDocument();
    });

    it('should pass current nature value', () => {
      renderBasicTab(defaultProps);

      const natureInput = screen.getByTestId(
        'input-nature'
      ) as HTMLInputElement;
      expect(natureInput.value).toBe('Jolly');
    });

    it('should call setNature when nature is changed', async () => {
      const user = userEvent.setup();
      renderBasicTab(defaultProps);

      const natureInput = screen.getByTestId('input-nature');
      await user.clear(natureInput);
      await user.type(natureInput, 'Adamant');

      expect(mockSetNature).toHaveBeenCalled();
    });

    it('should not have clear button for nature', () => {
      renderBasicTab(defaultProps);

      // Nature SearchableSelect does not have onClear prop, so no clear button
      expect(screen.queryByTestId('clear-nature')).not.toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch items for current generation', () => {
      renderBasicTab(defaultProps);

      expect(getItems).toHaveBeenCalledWith(9);
    });

    it('should fetch natures for current generation', () => {
      renderBasicTab(defaultProps);

      expect(getNatures).toHaveBeenCalledWith(9);
    });

    it('should fetch abilities from species', () => {
      renderBasicTab(defaultProps);

      expect(getPokemonAbilitiesDetailsFromSpecies).toHaveBeenCalledWith(
        mockSpecies,
        9
      );
    });
  });
});
