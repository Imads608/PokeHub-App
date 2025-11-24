import {
  TeamConfigurationSection,
  type TeamConfigurationSectionProps,
} from './team-configuration-section';
import type { GenerationNum, Tier } from '@pkmn/dex';
import type { BattleFormat } from '@pokehub/shared/pokemon-types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock context
const mockSetTeamName = jest.fn();
const mockSetGeneration = jest.fn();
const mockSetFormat = jest.fn();
const mockSetTier = jest.fn();
const mockClearTeam = jest.fn();
const mockHasAnyPokemon = jest.fn();

// Create mutable validation state for tests
const mockValidationState = {
  isValid: true,
  errors: [] as Array<{ field: string; message: string }>,
  showdownFormatId: 'gen9ou',
  timestamp: Date.now(),
};

jest.mock('../context/team-editor-context/team-editor.context', () => ({
  useTeamEditorContext: () => ({
    teamName: { value: 'My Team', setValue: mockSetTeamName },
    generation: { value: 9 as GenerationNum, setValue: mockSetGeneration },
    format: { value: 'Singles' as BattleFormat, setValue: mockSetFormat },
    tier: { value: 'OU' as Tier.Singles, setValue: mockSetTier },
    teamPokemon: {
      value: [],
      hasAnyPokemon: mockHasAnyPokemon,
      clearTeam: mockClearTeam,
    },
  }),
}));

// Mock team validation context
jest.mock('../context/team-validation-context/team-validation.context', () => ({
  useTeamValidationContext: () => ({
    get state() {
      return mockValidationState;
    },
    getTeamErrors: jest.fn(() => []),
    getPokemonErrors: jest.fn(() => []),
    get isTeamValid() {
      return mockValidationState.isValid;
    },
    showdownFormatId: 'gen9ou',
    isReady: true,
  }),
}));

// Mock useTeamChanges
const mockMarkAsSaved = jest.fn();
const mockHasChanges = jest.fn(() => false);

jest.mock('../hooks/useTeamChanges', () => ({
  useTeamChanges: () => ({
    hasChanges: mockHasChanges(),
    markAsSaved: mockMarkAsSaved,
  }),
}));

// Mock useTiersStaticData
jest.mock('../hooks/useTiersStaticData', () => ({
  useTiersStaticData: jest.fn(() => ({
    singlesTiers: [
      { id: 'OU', name: 'OverUsed', description: 'The main competitive tier' },
      { id: 'UU', name: 'UnderUsed', description: 'Second tier' },
    ],
    doublesTiers: [
      { id: 'DOU', name: 'Doubles OverUsed', description: 'Doubles main tier' },
      {
        id: 'DUU',
        name: 'Doubles UnderUsed',
        description: 'Doubles second tier',
      },
    ],
  })),
}));

// Mock data providers
jest.mock('@pokehub/frontend/pokemon-static-data', () => ({
  getGenerationsData: jest.fn(() => [
    { id: 9, name: 'Generation 9' },
    { id: 8, name: 'Generation 8' },
    { id: 7, name: 'Generation 7' },
  ]),
  getBattleTierInfo: jest.fn((tier: string) => {
    const tierInfo: Record<string, { name: string; description: string }> = {
      OU: { name: 'OverUsed', description: 'The main competitive tier' },
      UU: { name: 'UnderUsed', description: 'Second tier' },
      DOU: { name: 'Doubles OverUsed', description: 'Doubles main tier' },
    };
    return tierInfo[tier] || { name: tier, description: 'Battle tier' };
  }),
}));

// Mock TeamValidationSummary component
jest.mock('./team-validation-summary', () => ({
  TeamValidationSummary: ({
    validationResult,
  }: {
    validationResult: {
      isValid: boolean;
      errors: unknown[];
      showdownFormatId: string;
      timestamp: number;
    };
  }) => (
    <div data-testid="validation-summary">
      {validationResult.isValid ? 'Team Valid' : 'Validation Errors'}
    </div>
  ),
}));

// Mock FormatRulesDisplay component
jest.mock('./format-rules-display', () => ({
  FormatRulesDisplay: () => (
    <div data-testid="format-rules-display">Format Rules</div>
  ),
}));

describe('TeamConfigurationSection', () => {
  const defaultProps: TeamConfigurationSectionProps = {
    onOpenTeamAnalysis: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHasAnyPokemon.mockReturnValue(false);
    mockHasChanges.mockReturnValue(false);
  });

  describe('Rendering', () => {
    it('should render Team Configuration card', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      expect(screen.getByText('Team Configuration')).toBeInTheDocument();
      expect(
        screen.getByText('Set up your team format and rules')
      ).toBeInTheDocument();
    });

    it('should render Team Analysis card', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      expect(screen.getByText('Team Analysis')).toBeInTheDocument();
      expect(
        screen.getByText("Check your team's strengths and weaknesses")
      ).toBeInTheDocument();
    });

    it('should render all action buttons', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /export/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /import/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /save team/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /analyze team/i })
      ).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      expect(screen.getByLabelText('Team Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Generation')).toBeInTheDocument();
      expect(screen.getByLabelText('Format')).toBeInTheDocument();
      expect(screen.getByLabelText('Tier')).toBeInTheDocument();
    });

    it('should render validation summary', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      expect(screen.getByTestId('validation-summary')).toBeInTheDocument();
    });

    it('should render format description', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      expect(screen.getByText(/Standard 1v1 battles/i)).toBeInTheDocument();
    });

    it('should render tier description', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      expect(screen.getByText('The main competitive tier')).toBeInTheDocument();
    });
  });

  describe('Team Name Input', () => {
    it('should display current team name', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      const input = screen.getByLabelText('Team Name') as HTMLInputElement;
      expect(input.value).toBe('My Team');
    });

    it('should call setValue when team name changes', async () => {
      const user = userEvent.setup();
      render(<TeamConfigurationSection {...defaultProps} />);

      const input = screen.getByLabelText('Team Name');
      await user.clear(input);
      await user.type(input, 'New Team');

      expect(mockSetTeamName).toHaveBeenCalled();
    });
  });

  describe('Generation Selector', () => {
    it('should display current generation', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      expect(screen.getByText('Generation 9')).toBeInTheDocument();
    });

    it('should change generation freely when team is empty', async () => {
      const user = userEvent.setup();
      mockHasAnyPokemon.mockReturnValue(false);
      render(<TeamConfigurationSection {...defaultProps} />);

      const select = screen.getByLabelText('Generation');
      await user.click(select);

      const gen8Option = screen.getByRole('option', { name: 'Generation 8' });
      await user.click(gen8Option);

      expect(mockSetGeneration).toHaveBeenCalledWith(8);
    });

    it('should show confirmation dialog when team has Pokemon', async () => {
      const user = userEvent.setup();
      mockHasAnyPokemon.mockReturnValue(true);
      render(<TeamConfigurationSection {...defaultProps} />);

      const select = screen.getByLabelText('Generation');
      await user.click(select);

      const gen8Option = screen.getByRole('option', { name: 'Generation 8' });
      await user.click(gen8Option);

      await waitFor(() => {
        expect(screen.getByText('Change Generation?')).toBeInTheDocument();
      });
    });

    it('should cancel generation change from dialog', async () => {
      const user = userEvent.setup();
      mockHasAnyPokemon.mockReturnValue(true);
      render(<TeamConfigurationSection {...defaultProps} />);

      const select = screen.getByLabelText('Generation');
      await user.click(select);

      const gen8Option = screen.getByRole('option', { name: 'Generation 8' });
      await user.click(gen8Option);

      await waitFor(() => {
        expect(screen.getByText('Change Generation?')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Change Generation?')
        ).not.toBeInTheDocument();
      });

      expect(mockSetGeneration).not.toHaveBeenCalled();
      expect(mockClearTeam).not.toHaveBeenCalled();
    });

    it('should confirm generation change and clear team', async () => {
      const user = userEvent.setup();
      mockHasAnyPokemon.mockReturnValue(true);
      render(<TeamConfigurationSection {...defaultProps} />);

      const select = screen.getByLabelText('Generation');
      await user.click(select);

      const gen8Option = screen.getByRole('option', { name: 'Generation 8' });
      await user.click(gen8Option);

      await waitFor(() => {
        expect(screen.getByText('Change Generation?')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', {
        name: /clear team & change generation/i,
      });
      await user.click(confirmButton);

      expect(mockClearTeam).toHaveBeenCalled();
      expect(mockSetGeneration).toHaveBeenCalledWith(8);
      expect(toast.success).toHaveBeenCalledWith(
        'Team cleared and generation changed',
        expect.objectContaining({
          description: 'Switched to Generation 8',
        })
      );
    });
  });

  describe('Format Selector', () => {
    it('should display current format', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      const formatSelect = screen.getByLabelText('Format');
      expect(formatSelect).toHaveTextContent('Singles');
    });

    it('should change format to Doubles', async () => {
      const user = userEvent.setup();
      render(<TeamConfigurationSection {...defaultProps} />);

      const select = screen.getByLabelText('Format');
      await user.click(select);

      const doublesOption = screen.getByRole('option', { name: 'Doubles' });
      await user.click(doublesOption);

      expect(mockSetFormat).toHaveBeenCalledWith('Doubles');
      expect(mockSetTier).toHaveBeenCalledWith('DOU');
    });

    it('should call handlers when format changes', async () => {
      const user = userEvent.setup();
      render(<TeamConfigurationSection {...defaultProps} />);

      const select = screen.getByLabelText('Format');
      await user.click(select);

      const doublesOption = screen.getByRole('option', { name: 'Doubles' });
      await user.click(doublesOption);

      // Should call setFormat and setTier (to first tier of new format)
      expect(mockSetFormat).toHaveBeenCalledWith('Doubles');
      expect(mockSetTier).toHaveBeenCalledWith('DOU');
    });
  });

  describe('Tier Selector', () => {
    it('should display current tier', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      const tierSelect = screen.getByLabelText('Tier');
      expect(tierSelect).toHaveTextContent('OverUsed');
    });

    it('should change tier', async () => {
      const user = userEvent.setup();
      render(<TeamConfigurationSection {...defaultProps} />);

      const select = screen.getByLabelText('Tier');
      await user.click(select);

      const uuOption = screen.getByRole('option', { name: 'UnderUsed' });
      await user.click(uuOption);

      expect(mockSetTier).toHaveBeenCalledWith('UU');
    });
  });

  describe('Save Button', () => {
    it('should be disabled when no changes', () => {
      mockHasChanges.mockReturnValue(false);
      render(<TeamConfigurationSection {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save team/i });
      expect(saveButton).toBeDisabled();
    });

    it('should be disabled when validation errors exist', () => {
      mockHasChanges.mockReturnValue(true);

      // Set validation to invalid
      mockValidationState.isValid = false;
      mockValidationState.errors = [
        { field: 'teamName', message: 'Team name is required' },
      ];

      render(<TeamConfigurationSection {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save team/i });
      expect(saveButton).toBeDisabled();

      // Reset validation state
      mockValidationState.isValid = true;
      mockValidationState.errors = [];
    });

    it('should be enabled when hasChanges and isValid', () => {
      mockHasChanges.mockReturnValue(true);
      render(<TeamConfigurationSection {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save team/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should show saving state', async () => {
      const user = userEvent.setup();
      mockHasChanges.mockReturnValue(true);
      render(<TeamConfigurationSection {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save team/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/saving.../i)).toBeInTheDocument();
      });
    });

    it('should call markAsSaved and show success toast on save', async () => {
      const user = userEvent.setup();
      mockHasChanges.mockReturnValue(true);
      render(<TeamConfigurationSection {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save team/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMarkAsSaved).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          'Team saved successfully!',
          expect.objectContaining({
            description: 'My Team',
          })
        );
      });
    });

    it('should prevent save if validation errors exist', async () => {
      mockHasChanges.mockReturnValue(true);

      // Set validation to invalid
      mockValidationState.isValid = false;
      mockValidationState.errors = [
        { field: 'teamName', message: 'Team name is required' },
      ];

      render(<TeamConfigurationSection {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save team/i });

      // Button should be disabled, so clicking it should not trigger save
      expect(saveButton).toBeDisabled();

      // Reset validation state
      mockValidationState.isValid = true;
      mockValidationState.errors = [];
    });
  });

  describe('Team Analysis Button', () => {
    it('should be disabled when team is empty', () => {
      mockHasAnyPokemon.mockReturnValue(false);
      render(<TeamConfigurationSection {...defaultProps} />);

      const analyzeButton = screen.getByRole('button', {
        name: /analyze team/i,
      });
      expect(analyzeButton).toBeDisabled();
    });

    it('should be enabled when team has Pokemon', () => {
      mockHasAnyPokemon.mockReturnValue(true);
      render(<TeamConfigurationSection {...defaultProps} />);

      const analyzeButton = screen.getByRole('button', {
        name: /analyze team/i,
      });
      expect(analyzeButton).not.toBeDisabled();
    });

    it('should call onOpenTeamAnalysis when clicked', async () => {
      const user = userEvent.setup();
      const onOpenTeamAnalysis = jest.fn();
      mockHasAnyPokemon.mockReturnValue(true);
      render(
        <TeamConfigurationSection onOpenTeamAnalysis={onOpenTeamAnalysis} />
      );

      const analyzeButton = screen.getByRole('button', {
        name: /analyze team/i,
      });
      await user.click(analyzeButton);

      expect(onOpenTeamAnalysis).toHaveBeenCalled();
    });
  });

  describe('Validation Integration', () => {
    it('should use validation state from context', () => {
      render(<TeamConfigurationSection {...defaultProps} />);

      // Component should render validation summary with state from context
      const validationSummary = screen.getByTestId('validation-summary');
      expect(validationSummary).toBeInTheDocument();
      expect(validationSummary).toHaveTextContent('Team Valid');
    });
  });
});
