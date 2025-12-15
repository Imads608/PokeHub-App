import {
  createMockTeams,
  createMockUseTeamViewerFiltersReturn,
} from '../../test-utils/team-viewer-test-utils';
import { useUserTeams, useCreateTeam, useDeleteTeam } from '../hooks/useTeams';
import { useTeamViewerFilters } from './context/team-viewer.context';
import { useFilteredTeams } from './hooks/useFilteredTeams';
import { TeamViewer } from './team-viewer';
import type { PokemonTeam } from '@pokehub/shared/pokemon-types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock hooks
jest.mock('../hooks/useTeams');
jest.mock('./context/team-viewer.context');
jest.mock('./hooks/useFilteredTeams');

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock @pkmn/img
jest.mock('@pkmn/img', () => ({
  Icons: {
    getPokemon: jest.fn(() => ({
      css: { backgroundImage: 'url(pokemon-sprite.png)' },
    })),
  },
}));

// Mock dex-data-provider
jest.mock('@pokehub/frontend/dex-data-provider', () => ({
  getFormatDisplayName: jest.fn((_gen, format) => {
    const formatMap: Record<string, string> = {
      ou: 'OU',
      vgc2024rege: 'VGC 2024 Reg E',
      vgc2022: 'VGC 2022',
    };
    return formatMap[format] || format;
  }),
}));

// Mock child components to simplify testing
jest.mock('./components/team-card', () => ({
  TeamCard: ({
    team,
    onEdit,
    onDuplicate,
    onDelete,
  }: {
    team: { id: string; name: string };
    onEdit: (id: string) => void;
    onDuplicate: (team: { id: string; name: string }) => void;
    onDelete: (team: { id: string; name: string }) => void;
  }) => (
    <div data-testid={`team-card-${team.id}`}>
      <span>{team.name}</span>
      <button onClick={() => onEdit(team.id)}>Edit</button>
      <button onClick={() => onDuplicate(team)}>Duplicate</button>
      <button onClick={() => onDelete(team)}>Delete</button>
    </div>
  ),
}));

jest.mock('./components/team-list-item', () => ({
  TeamListItem: ({
    team,
    onEdit,
    onDuplicate,
    onDelete,
  }: {
    team: { id: string; name: string };
    onEdit: (id: string) => void;
    onDuplicate: (team: { id: string; name: string }) => void;
    onDelete: (team: { id: string; name: string }) => void;
  }) => (
    <div data-testid={`team-list-item-${team.id}`}>
      <span>{team.name}</span>
      <button onClick={() => onEdit(team.id)}>Edit</button>
      <button onClick={() => onDuplicate(team)}>Duplicate</button>
      <button onClick={() => onDelete(team)}>Delete</button>
    </div>
  ),
}));

jest.mock('./components/delete-team-dialog', () => ({
  DeleteTeamDialog: ({
    team,
    open,
    onOpenChange,
    onConfirm,
    isDeleting,
  }: {
    team: { name: string } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isDeleting: boolean;
  }) =>
    open ? (
      <div data-testid="delete-dialog">
        <span>Delete {team?.name}?</span>
        <button onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    ) : null,
}));

const mockUseUserTeams = useUserTeams as jest.MockedFunction<
  typeof useUserTeams
>;
const mockUseCreateTeam = useCreateTeam as jest.MockedFunction<
  typeof useCreateTeam
>;
const mockUseDeleteTeam = useDeleteTeam as jest.MockedFunction<
  typeof useDeleteTeam
>;
const mockUseTeamViewerFilters = useTeamViewerFilters as jest.MockedFunction<
  typeof useTeamViewerFilters
>;
const mockUseFilteredTeams = useFilteredTeams as jest.MockedFunction<
  typeof useFilteredTeams
>;

describe('TeamViewer', () => {
  const mockTeams = createMockTeams(3);

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseUserTeams.mockReturnValue({
      data: mockTeams,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useUserTeams>);

    mockUseCreateTeam.mockReturnValue({
      mutateAsync: jest
        .fn()
        .mockResolvedValue({ id: 'new-team', name: 'New Team' }),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateTeam>);

    mockUseDeleteTeam.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteTeam>);

    mockUseTeamViewerFilters.mockReturnValue(
      createMockUseTeamViewerFiltersReturn()
    );

    mockUseFilteredTeams.mockReturnValue(mockTeams);
  });

  describe('loading state', () => {
    it('should show loading skeletons when loading', () => {
      mockUseUserTeams.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as ReturnType<typeof useUserTeams>);

      render(<TeamViewer />);

      // Should show skeleton elements
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('error state', () => {
    it('should show error message when loading fails', () => {
      mockUseUserTeams.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as ReturnType<typeof useUserTeams>);

      render(<TeamViewer />);

      expect(screen.getByText('Error loading teams')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no teams', () => {
      mockUseUserTeams.mockReturnValue({
        data: [] as PokemonTeam[],
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useUserTeams>);
      mockUseFilteredTeams.mockReturnValue([]);

      render(<TeamViewer />);

      expect(screen.getByText('No teams yet')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create your first team/i })
      ).toBeInTheDocument();
    });

    it('should navigate to create team when clicking Create Your First Team', async () => {
      const user = userEvent.setup();

      mockUseUserTeams.mockReturnValue({
        data: [] as PokemonTeam[],
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useUserTeams>);
      mockUseFilteredTeams.mockReturnValue([]);

      render(<TeamViewer />);

      const createButton = screen.getByRole('button', {
        name: /create your first team/i,
      });
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/team-builder/new');
    });
  });

  describe('no results state', () => {
    it('should show no results message when filters return empty', () => {
      mockUseFilteredTeams.mockReturnValue([]);

      render(<TeamViewer />);

      expect(screen.getByText('No teams found')).toBeInTheDocument();
      expect(
        screen.getByText(/no teams match your current filters/i)
      ).toBeInTheDocument();
    });

    it('should show Clear Filters button in no results state', () => {
      mockUseFilteredTeams.mockReturnValue([]);

      render(<TeamViewer />);

      expect(
        screen.getByRole('button', { name: /clear filters/i })
      ).toBeInTheDocument();
    });
  });

  describe('with teams', () => {
    it('should render header with title', () => {
      render(<TeamViewer />);

      expect(screen.getByText('My Teams')).toBeInTheDocument();
      expect(
        screen.getByText('Manage your competitive Pokemon teams')
      ).toBeInTheDocument();
    });

    it('should render Create New Team button', () => {
      render(<TeamViewer />);

      expect(
        screen.getByRole('button', { name: /create new team/i })
      ).toBeInTheDocument();
    });

    it('should render filter card', () => {
      render(<TeamViewer />);

      expect(screen.getByText('Filter Teams')).toBeInTheDocument();
    });

    it('should render teams in grid view by default', () => {
      render(<TeamViewer />);

      expect(screen.getByTestId('team-card-team-1')).toBeInTheDocument();
      expect(screen.getByTestId('team-card-team-2')).toBeInTheDocument();
      expect(screen.getByTestId('team-card-team-3')).toBeInTheDocument();
    });

    it('should render teams in list view when viewMode is list', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          viewMode: {
            value: 'list',
            setValue: jest.fn(),
            toggleViewMode: jest.fn(),
          },
        })
      );

      render(<TeamViewer />);

      expect(screen.getByTestId('team-list-item-team-1')).toBeInTheDocument();
      expect(screen.getByTestId('team-list-item-team-2')).toBeInTheDocument();
      expect(screen.getByTestId('team-list-item-team-3')).toBeInTheDocument();
    });
  });

  describe('create team', () => {
    it('should navigate to create team page when clicking Create New Team', async () => {
      const user = userEvent.setup();

      render(<TeamViewer />);

      const createButton = screen.getByRole('button', {
        name: /create new team/i,
      });
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/team-builder/new');
    });
  });

  describe('edit team', () => {
    it('should navigate to edit team page when clicking Edit', async () => {
      const user = userEvent.setup();

      render(<TeamViewer />);

      const editButton = screen.getAllByRole('button', { name: /^edit$/i })[0];
      await user.click(editButton);

      expect(mockPush).toHaveBeenCalledWith('/team-builder/team-1');
    });
  });

  describe('duplicate team', () => {
    it('should call createTeam mutation when duplicating', async () => {
      const user = userEvent.setup();
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: 'duplicated-team',
        name: 'Alpha Team (Copy)',
      });

      mockUseCreateTeam.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as unknown as ReturnType<typeof useCreateTeam>);

      render(<TeamViewer />);

      const duplicateButton = screen.getAllByRole('button', {
        name: /duplicate/i,
      })[0];
      await user.click(duplicateButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Alpha Team (Copy)',
          })
        );
      });
    });

    it('should navigate to duplicated team after creation', async () => {
      const user = userEvent.setup();
      const mockMutateAsync = jest.fn().mockResolvedValue({
        id: 'duplicated-team',
        name: 'Alpha Team (Copy)',
      });

      mockUseCreateTeam.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as unknown as ReturnType<typeof useCreateTeam>);

      render(<TeamViewer />);

      const duplicateButton = screen.getAllByRole('button', {
        name: /duplicate/i,
      })[0];
      await user.click(duplicateButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/team-builder/duplicated-team');
      });
    });
  });

  describe('delete team', () => {
    it('should open delete dialog when clicking Delete', async () => {
      const user = userEvent.setup();

      render(<TeamViewer />);

      const deleteButton = screen.getAllByRole('button', {
        name: /^delete$/i,
      })[0];
      await user.click(deleteButton);

      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      expect(screen.getByText(/delete alpha team/i)).toBeInTheDocument();
    });

    it('should close delete dialog when clicking Cancel', async () => {
      const user = userEvent.setup();

      render(<TeamViewer />);

      const deleteButton = screen.getAllByRole('button', {
        name: /^delete$/i,
      })[0];
      await user.click(deleteButton);

      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
    });

    it('should call deleteTeam mutation when confirming delete', async () => {
      const user = userEvent.setup();
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);

      mockUseDeleteTeam.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as unknown as ReturnType<typeof useDeleteTeam>);

      render(<TeamViewer />);

      const deleteButton = screen.getAllByRole('button', {
        name: /^delete$/i,
      })[0];
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm delete/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith('team-1');
      });
    });
  });

  describe('filters', () => {
    it('should render search input', () => {
      render(<TeamViewer />);

      expect(
        screen.getByPlaceholderText('Search teams...')
      ).toBeInTheDocument();
    });

    it('should render generation filter', () => {
      render(<TeamViewer />);

      expect(screen.getByText('Generation')).toBeInTheDocument();
    });

    it('should render format filter', () => {
      render(<TeamViewer />);

      expect(screen.getByText('Format')).toBeInTheDocument();
    });

    it('should render sort by filter', () => {
      render(<TeamViewer />);

      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    it('should show Active badge when filters are active', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          hasActiveFilters: true,
        })
      );

      render(<TeamViewer />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show Clear Filters button when filters are active', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          hasActiveFilters: true,
        })
      );

      render(<TeamViewer />);

      expect(
        screen.getByRole('button', { name: /clear filters/i })
      ).toBeInTheDocument();
    });

    it('should call resetFilters when clicking Clear Filters', async () => {
      const user = userEvent.setup();
      const mockResetFilters = jest.fn();

      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          hasActiveFilters: true,
          resetFilters: mockResetFilters,
        })
      );

      render(<TeamViewer />);

      const clearButton = screen.getByRole('button', {
        name: /clear filters/i,
      });
      await user.click(clearButton);

      expect(mockResetFilters).toHaveBeenCalled();
    });

    it('should show filtered count when filters are active', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          hasActiveFilters: true,
        })
      );
      mockUseFilteredTeams.mockReturnValue([mockTeams[0]]);

      render(<TeamViewer />);

      expect(screen.getByText(/showing 1 of 3 teams/i)).toBeInTheDocument();
    });
  });

  describe('view mode toggle', () => {
    it('should render grid view button', () => {
      render(<TeamViewer />);

      expect(
        screen.getByRole('button', { name: /grid view/i })
      ).toBeInTheDocument();
    });

    it('should render list view button', () => {
      render(<TeamViewer />);

      expect(
        screen.getByRole('button', { name: /list view/i })
      ).toBeInTheDocument();
    });

    it('should call setValue when clicking view mode button', async () => {
      const user = userEvent.setup();
      const mockSetValue = jest.fn();

      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          viewMode: {
            value: 'grid',
            setValue: mockSetValue,
            toggleViewMode: jest.fn(),
          },
        })
      );

      render(<TeamViewer />);

      const listButton = screen.getByRole('button', { name: /list view/i });
      await user.click(listButton);

      expect(mockSetValue).toHaveBeenCalledWith('list');
    });
  });

  describe('sort order toggle', () => {
    it('should render sort order toggle button', () => {
      render(<TeamViewer />);

      expect(
        screen.getByRole('button', { name: /toggle sort order/i })
      ).toBeInTheDocument();
    });

    it('should call toggleSortOrder when clicking toggle button', async () => {
      const user = userEvent.setup();
      const mockToggleSortOrder = jest.fn();

      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          sortOrder: {
            value: 'desc',
            setValue: jest.fn(),
            toggleSortOrder: mockToggleSortOrder,
          },
        })
      );

      render(<TeamViewer />);

      const toggleButton = screen.getByRole('button', {
        name: /toggle sort order/i,
      });
      await user.click(toggleButton);

      expect(mockToggleSortOrder).toHaveBeenCalled();
    });
  });
});
