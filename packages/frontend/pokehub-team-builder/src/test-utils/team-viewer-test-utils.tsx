import type { UseTeamViewerFiltersReturn } from '../lib/team-viewer/context/team-viewer.context';
import type { TeamViewerFilters } from '../lib/team-viewer/context/team-viewer.context.model';
import { TeamViewerProvider } from '../lib/team-viewer/context/team-viewer.provider';
import type { GenerationNum } from '@pkmn/dex';
import type { PokemonInTeam, PokemonTeam } from '@pokehub/shared/pokemon-types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

/**
 * Create a test QueryClient with disabled retries for predictable test behavior
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Loose type for mock pokemon overrides (allows string instead of branded types)
 */
type MockPokemonOverrides = {
  species?: string;
  name?: string;
  ability?: string;
  item?: string;
  nature?: string;
  gender?: string;
  level?: number;
  moves?: string[];
  evs?: PokemonInTeam['evs'];
  ivs?: PokemonInTeam['ivs'];
};

/**
 * Create a mock PokemonInTeam with sensible defaults
 */
export function createMockPokemon(
  overrides?: MockPokemonOverrides
): PokemonInTeam {
  return {
    species: 'Pikachu',
    name: '',
    ability: 'Static',
    item: '',
    nature: 'Hardy',
    gender: 'N',
    level: 50,
    moves: ['Thunderbolt', '', '', ''],
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    ...overrides,
  } as PokemonInTeam;
}

/**
 * Create a mock PokemonTeam with sensible defaults
 */
export function createMockTeam(overrides?: Partial<PokemonTeam>): PokemonTeam {
  return {
    id: 'team-123',
    userId: 'user-123',
    name: 'Test Team',
    generation: 9 as GenerationNum,
    format: 'ou',
    pokemon: [createMockPokemon()],
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-15T00:00:00.000Z'),
    ...overrides,
  };
}

/**
 * Create multiple mock teams with different properties
 */
export function createMockTeams(count = 3): PokemonTeam[] {
  const teamConfigs = [
    {
      id: 'team-1',
      name: 'Alpha Team',
      generation: 9 as GenerationNum,
      format: 'ou',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-15T00:00:00.000Z'),
    },
    {
      id: 'team-2',
      name: 'Beta Team',
      generation: 9 as GenerationNum,
      format: 'vgc2024rege',
      createdAt: new Date('2024-01-05T00:00:00.000Z'),
      updatedAt: new Date('2024-01-10T00:00:00.000Z'),
    },
    {
      id: 'team-3',
      name: 'Gamma Team',
      generation: 8 as GenerationNum,
      format: 'ou',
      createdAt: new Date('2024-01-10T00:00:00.000Z'),
      updatedAt: new Date('2024-01-12T00:00:00.000Z'),
    },
    {
      id: 'team-4',
      name: 'Delta Team',
      generation: 8 as GenerationNum,
      format: 'vgc2022',
      createdAt: new Date('2024-01-03T00:00:00.000Z'),
      updatedAt: new Date('2024-01-08T00:00:00.000Z'),
    },
    {
      id: 'team-5',
      name: 'Epsilon Team',
      generation: 7 as GenerationNum,
      format: 'ou',
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
      updatedAt: new Date('2024-01-20T00:00:00.000Z'),
    },
  ];

  return teamConfigs.slice(0, count).map((config) => createMockTeam(config));
}

/**
 * Create mock filter context value for testing
 */
export function createMockFilterContext(
  overrides?: Partial<TeamViewerFilters<'ReadWrite'>>
): TeamViewerFilters<'ReadWrite'> {
  return {
    searchTerm: {
      value: '',
      setValue: jest.fn(),
    },
    selectedGeneration: {
      value: 'all',
      setValue: jest.fn(),
    },
    selectedFormat: {
      value: 'all',
      setValue: jest.fn(),
    },
    sortBy: {
      value: 'updated',
      setValue: jest.fn(),
    },
    sortOrder: {
      value: 'desc',
      setValue: jest.fn(),
    },
    viewMode: {
      value: 'grid',
      setValue: jest.fn(),
    },
    ...overrides,
  };
}

interface TestProvidersOptions {
  queryClient?: QueryClient;
  includeTeamViewerProvider?: boolean;
}

/**
 * Create wrapper component with all necessary providers for testing
 */
function createTestProviders(options: TestProvidersOptions = {}) {
  const {
    queryClient = createTestQueryClient(),
    includeTeamViewerProvider = true,
  } = options;

  return function TestProviders({ children }: { children: ReactNode }) {
    let content = children;

    if (includeTeamViewerProvider) {
      content = <TeamViewerProvider>{content}</TeamViewerProvider>;
    }

    return (
      <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
    );
  };
}

/**
 * Custom render function that wraps component with TeamViewerProvider and QueryClientProvider
 */
export function renderWithTeamViewerProvider(
  ui: ReactElement,
  options: Omit<RenderOptions, 'wrapper'> & TestProvidersOptions = {}
) {
  const { queryClient, includeTeamViewerProvider, ...renderOptions } = options;

  return {
    ...render(ui, {
      wrapper: createTestProviders({ queryClient, includeTeamViewerProvider }),
      ...renderOptions,
    }),
    queryClient: queryClient ?? createTestQueryClient(),
  };
}

/**
 * Custom render function that only wraps with QueryClientProvider
 */
export function renderWithQueryClient(
  ui: ReactElement,
  options: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient } = {}
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
      ...renderOptions,
    }),
    queryClient,
  };
}

/**
 * Create mock useTeamViewerFilters hook return value
 */
export function createMockUseTeamViewerFiltersReturn(
  overrides?: Partial<UseTeamViewerFiltersReturn>
): UseTeamViewerFiltersReturn {
  return {
    searchTerm: { value: '', setValue: jest.fn() },
    selectedGeneration: { value: 'all', setValue: jest.fn() },
    selectedFormat: { value: 'all', setValue: jest.fn() },
    sortBy: { value: 'updated', setValue: jest.fn() },
    sortOrder: {
      value: 'desc',
      setValue: jest.fn(),
      toggleSortOrder: jest.fn(),
    },
    viewMode: { value: 'grid', setValue: jest.fn(), toggleViewMode: jest.fn() },
    resetFilters: jest.fn(),
    hasActiveFilters: false,
    ...overrides,
  };
}
