import {
  createMockTeam,
  createMockPokemon,
} from '../../test-utils/team-viewer-test-utils';
import { TeamViewerProvider } from './context/team-viewer.provider';
import { TeamViewer } from './team-viewer';
import type { GenerationNum } from '@pkmn/dex';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock sonner toast
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
      uu: 'UU',
      vgc2024rege: 'VGC 2024 Reg E',
      vgc2024regg: 'VGC 2024 Reg G',
      doublesou: 'Doubles OU',
    };
    return formatMap[format] || format;
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

// Mock the API functions
const mockGetUserTeams = jest.fn();
const mockCreateTeamRequest = jest.fn();
const mockDeleteTeamRequest = jest.fn();

jest.mock('../api/teams-api', () => ({
  getUserTeams: (...args: unknown[]) => mockGetUserTeams(...args),
  createTeamRequest: (...args: unknown[]) => mockCreateTeamRequest(...args),
  deleteTeamRequest: (...args: unknown[]) => mockDeleteTeamRequest(...args),
}));

// Mock the auth session
jest.mock('@pokehub/frontend/shared-auth', () => ({
  useAuthSession: () => ({
    data: {
      user: { id: 'user-123', email: 'test@example.com' },
      accessToken: 'mock-token',
    },
    status: 'authenticated',
  }),
}));

// Mock withAuthRetry to pass through to the request function
jest.mock('@pokehub/frontend/pokehub-data-provider', () => ({
  withAuthRetry: jest.fn(
    async <Data,>(
      _accessToken: string,
      request: (token: string) => Promise<{ json: () => Promise<Data> }>
    ) => {
      return request(_accessToken);
    }
  ),
  withAuthRetryWithoutResponse: jest.fn(
    async <Data,>(
      _accessToken: string,
      request: (token: string) => Promise<Data>
    ) => {
      return request(_accessToken);
    }
  ),
}));

// Test data
const mockTeams = [
  createMockTeam({
    id: 'team-1',
    name: 'Gen 9 OU Team',
    generation: 9 as GenerationNum,
    format: 'ou',
    pokemon: [
      createMockPokemon({ species: 'Great Tusk' }),
      createMockPokemon({ species: 'Gholdengo' }),
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  }),
  createMockTeam({
    id: 'team-2',
    name: 'VGC Regulation E',
    generation: 9 as GenerationNum,
    format: 'vgc2024rege',
    pokemon: [
      createMockPokemon({ species: 'Flutter Mane' }),
      createMockPokemon({ species: 'Raging Bolt' }),
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
  }),
  createMockTeam({
    id: 'team-3',
    name: 'Gen 8 OU Classic',
    generation: 8 as GenerationNum,
    format: 'ou',
    pokemon: [
      createMockPokemon({ species: 'Dragapult' }),
      createMockPokemon({ species: 'Urshifu' }),
    ],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-12'),
  }),
  createMockTeam({
    id: 'team-4',
    name: 'Alpha VGC Team',
    generation: 9 as GenerationNum,
    format: 'vgc2024regg',
    pokemon: [createMockPokemon({ species: 'Miraidon' })],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-25'),
  }),
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function renderTeamViewer(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();

  return {
    ...render(
      <QueryClientProvider client={client}>
        <TeamViewerProvider>
          <TeamViewer />
        </TeamViewerProvider>
      </QueryClientProvider>
    ),
    queryClient: client,
  };
}

describe('TeamViewer Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserTeams.mockResolvedValue(mockTeams);
    // createTeamRequest returns a FetchResponse with .json() method
    // First team in sorted order (by updatedAt desc) is team-4 (Alpha VGC Team)
    mockCreateTeamRequest.mockResolvedValue({
      json: () =>
        Promise.resolve({
          ...mockTeams[3], // team-4 (Alpha VGC Team)
          id: 'new-team-id',
          name: 'Alpha VGC Team (Copy)',
        }),
      ok: true,
      status: 201,
    });
    // deleteTeamRequest returns a FetchResponse (void response)
    mockDeleteTeamRequest.mockResolvedValue({
      json: () => Promise.resolve(undefined),
      ok: true,
      status: 204,
    });
  });

  describe('Data Fetching Flow', () => {
    it('should fetch and display teams on mount', async () => {
      renderTeamViewer();

      // Wait for teams to load
      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      expect(screen.getByText('VGC Regulation E')).toBeInTheDocument();
      expect(screen.getByText('Gen 8 OU Classic')).toBeInTheDocument();
      expect(screen.getByText('Alpha VGC Team')).toBeInTheDocument();

      // API should have been called once
      expect(mockGetUserTeams).toHaveBeenCalledTimes(1);
    });

    it('should show error state when API fails', async () => {
      mockGetUserTeams.mockRejectedValue(new Error('API Error'));

      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Error loading teams')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/There was a problem loading your teams/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
    });

    it('should show empty state when no teams', async () => {
      mockGetUserTeams.mockResolvedValue([]);

      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('No teams yet')).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: /create your first team/i })
      ).toBeInTheDocument();
    });
  });

  describe('Complete Filter Flow', () => {
    it('should filter teams by search term with debounce', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Type in search box
      const searchInput = screen.getByPlaceholderText('Search teams...');
      await user.type(searchInput, 'VGC');

      // Should show only VGC teams after debounce
      await waitFor(() => {
        expect(screen.getByText('VGC Regulation E')).toBeInTheDocument();
        expect(screen.getByText('Alpha VGC Team')).toBeInTheDocument();
        expect(screen.queryByText('Gen 9 OU Team')).not.toBeInTheDocument();
        expect(screen.queryByText('Gen 8 OU Classic')).not.toBeInTheDocument();
      });

      // Should show filter count
      await waitFor(() => {
        expect(screen.getByText(/Showing 2 of 4 teams/i)).toBeInTheDocument();
      });
    });

    it('should filter teams by generation', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Open generation dropdown and select Gen 8
      const generationTrigger = screen.getByTestId('generation-filter');
      await user.click(generationTrigger);

      const gen8Option = await screen.findByRole('option', {
        name: 'Generation 8',
      });
      await user.click(gen8Option);

      // Should show only Gen 8 teams
      await waitFor(() => {
        expect(screen.getByText('Gen 8 OU Classic')).toBeInTheDocument();
        expect(screen.queryByText('Gen 9 OU Team')).not.toBeInTheDocument();
      });
    });

    it('should filter teams by format', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Open format dropdown and select OU
      const formatSelect = screen.getByTestId('format-filter');
      await user.click(formatSelect);

      const ouOption = await screen.findByRole('option', { name: 'OU' });
      await user.click(ouOption);

      // Should show only OU teams
      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
        expect(screen.getByText('Gen 8 OU Classic')).toBeInTheDocument();
        expect(screen.queryByText('VGC Regulation E')).not.toBeInTheDocument();
      });
    });

    it('should combine multiple filters (search + filtering)', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Search for "Alpha"
      const searchInput = screen.getByPlaceholderText('Search teams...');
      await user.type(searchInput, 'Alpha');

      // Should only show Alpha VGC Team
      await waitFor(() => {
        expect(screen.getByText('Alpha VGC Team')).toBeInTheDocument();
        expect(screen.queryByText('Gen 9 OU Team')).not.toBeInTheDocument();
        expect(screen.queryByText('VGC Regulation E')).not.toBeInTheDocument();
        expect(screen.queryByText('Gen 8 OU Classic')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Showing 1 of 4 teams/i)).toBeInTheDocument();
      });
    });

    it('should reset all filters when Clear Filters is clicked', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Apply a filter
      const searchInput = screen.getByPlaceholderText('Search teams...');
      await user.type(searchInput, 'VGC');

      await waitFor(() => {
        expect(screen.getByText(/Showing 2 of 4 teams/i)).toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByRole('button', {
        name: /clear filters/i,
      });
      await user.click(clearButton);

      // All teams should be visible again
      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
        expect(screen.getByText('VGC Regulation E')).toBeInTheDocument();
        expect(screen.getByText('Gen 8 OU Classic')).toBeInTheDocument();
        expect(screen.getByText('Alpha VGC Team')).toBeInTheDocument();
      });
    });

    it('should show "no results" state when filters match nothing', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText('Search teams...');
      await user.type(searchInput, 'NONEXISTENT');

      await waitFor(() => {
        expect(screen.getByText('No teams found')).toBeInTheDocument();
        expect(
          screen.getByText(/no teams match your current filters/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Flow', () => {
    it('should sort teams by name', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Open sort dropdown and select Name
      const sortSelect = screen.getByTestId('sort-filter');
      await user.click(sortSelect);

      const nameOption = await screen.findByRole('option', { name: 'Name' });
      await user.click(nameOption);

      // Teams should be sorted alphabetically (desc by default)
      await waitFor(() => {
        const teamLinks = screen.getAllByRole('link');
        // In descending order: VGC Regulation E should be first
        expect(teamLinks[0]).toHaveTextContent('VGC Regulation E');
      });
    });

    it('should toggle sort order', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // First select sort by Name
      const sortSelect = screen.getByTestId('sort-filter');
      await user.click(sortSelect);

      const nameOption = await screen.findByRole('option', { name: 'Name' });
      await user.click(nameOption);

      // Toggle sort order (should change to ascending)
      const toggleButton = screen.getByRole('button', {
        name: /toggle sort order/i,
      });
      await user.click(toggleButton);

      // Teams should now be in ascending order
      await waitFor(() => {
        const teamLinks = screen.getAllByRole('link');
        // In ascending order: Alpha VGC Team should be first
        expect(teamLinks[0]).toHaveTextContent('Alpha VGC Team');
      });
    });
  });

  describe('View Mode Toggle', () => {
    it('should switch between grid and list view', async () => {
      const user = userEvent.setup();
      const { container } = renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Default should be grid view (cards)
      expect(container.querySelector('.grid')).toBeInTheDocument();

      // Click list view button
      const listViewButton = screen.getByRole('button', { name: /list view/i });
      await user.click(listViewButton);

      // Should switch to list view - check that flex column layout is present
      await waitFor(() => {
        const teamListItems = container.querySelectorAll(
          '[class*="flex"][class*="flex-col"]'
        );
        expect(teamListItems.length).toBeGreaterThan(0);
      });

      // Click grid view button
      const gridViewButton = screen.getByRole('button', { name: /grid view/i });
      await user.click(gridViewButton);

      // Should switch back to grid view
      await waitFor(() => {
        expect(container.querySelector('.grid')).toBeInTheDocument();
      });
    });
  });

  describe('Team Actions with Cache Invalidation', () => {
    it('should navigate to create team page', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', {
        name: /create new team/i,
      });
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/team-builder/new');
    });

    it('should navigate to edit team on card click', async () => {
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // TeamCard has a link that navigates to the team editor
      // First link is team-4 (Alpha VGC Team) due to updatedAt sort
      const teamLink = screen.getAllByRole('link')[0];
      expect(teamLink).toHaveAttribute('href', '/team-builder/team-4');
    });

    it('should duplicate team and navigate to new team', async () => {
      const user = userEvent.setup();
      const { toast } = jest.requireMock('sonner');
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Open menu and click duplicate - first button is team-4 (Alpha VGC Team)
      const menuButtons = screen.getAllByRole('button', { name: /open menu/i });
      await user.click(menuButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByRole('menuitem', { name: /duplicate/i })
        ).toBeInTheDocument();
      });

      const duplicateButton = screen.getByRole('menuitem', {
        name: /duplicate/i,
      });
      await user.click(duplicateButton);

      // Wait for mutation
      await waitFor(() => {
        expect(mockCreateTeamRequest).toHaveBeenCalled();
      });

      // Should show success toast and navigate
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Team duplicated', {
          description: expect.stringContaining('Alpha VGC Team (Copy)'),
        });
      });

      expect(mockPush).toHaveBeenCalledWith('/team-builder/new-team-id');
    });

    it('should delete team after confirmation', async () => {
      const user = userEvent.setup();
      const { toast } = jest.requireMock('sonner');
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Open menu and click delete - first button is for team-4 (Alpha VGC Team)
      // since default sort is by updatedAt descending
      const menuButtons = screen.getAllByRole('button', { name: /open menu/i });
      await user.click(menuButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByRole('menuitem', { name: /delete/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      // Dialog should open
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /delete team/i })
        ).toBeInTheDocument();
      });

      // Click confirm delete
      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      // Wait for mutation - team-4 is first due to updatedAt sort
      await waitFor(() => {
        expect(mockDeleteTeamRequest).toHaveBeenCalledWith(
          'mock-token',
          'team-4'
        );
      });

      // Should show success toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Team deleted', {
          description: expect.stringContaining('Alpha VGC Team'),
        });
      });
    });

    it('should close delete dialog on cancel', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Open menu and click delete
      const menuButtons = screen.getAllByRole('button', { name: /open menu/i });
      await user.click(menuButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByRole('menuitem', { name: /delete/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('menuitem', { name: /delete/i }));

      // Dialog should open
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /delete team/i })
        ).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: /delete team/i })
        ).not.toBeInTheDocument();
      });

      // API should not have been called
      expect(mockDeleteTeamRequest).not.toHaveBeenCalled();
    });
  });

  describe('Context Propagation', () => {
    it('should show active filters badge when filters are applied', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Initially no active badge
      expect(screen.queryByText('Active')).not.toBeInTheDocument();

      // Apply a filter
      const searchInput = screen.getByPlaceholderText('Search teams...');
      await user.type(searchInput, 'VGC');

      // Active badge should appear
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should update available formats when generation changes', async () => {
      const user = userEvent.setup();
      renderTeamViewer();

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // Open format dropdown to see all formats
      const formatSelect = screen.getByTestId('format-filter');
      await user.click(formatSelect);

      // Should show all formats initially
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'OU' })).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: 'VGC 2024 Reg E' })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: 'VGC 2024 Reg G' })
        ).toBeInTheDocument();
      });

      // Close dropdown by clicking elsewhere
      await user.keyboard('{Escape}');

      // Select Gen 8
      const generationSelect = screen.getByTestId('generation-filter');
      await user.click(generationSelect);

      const gen8Option = await screen.findByRole('option', {
        name: 'Generation 8',
      });
      await user.click(gen8Option);

      // Open format dropdown again
      const updatedFormatSelect = screen.getByTestId('format-filter');
      await user.click(updatedFormatSelect);

      // Should only show OU (the only Gen 8 format in our test data)
      await waitFor(() => {
        const ouOptions = screen.queryAllByRole('option', { name: 'OU' });
        expect(ouOptions.length).toBe(1);
      });

      // VGC formats should not be visible (they're Gen 9 only)
      expect(
        screen.queryByRole('option', { name: 'VGC 2024 Reg E' })
      ).not.toBeInTheDocument();
    });
  });

  describe('React Query Cache Behavior', () => {
    it('should use cached data on subsequent renders', async () => {
      const queryClient = createTestQueryClient();

      // First render
      const { unmount } = renderTeamViewer(queryClient);

      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      expect(mockGetUserTeams).toHaveBeenCalledTimes(1);

      // Unmount
      unmount();

      // Re-render with same query client
      renderTeamViewer(queryClient);

      // Should use cached data (no additional fetch)
      await waitFor(() => {
        expect(screen.getByText('Gen 9 OU Team')).toBeInTheDocument();
      });

      // API should not have been called again
      expect(mockGetUserTeams).toHaveBeenCalledTimes(1);
    });
  });
});
