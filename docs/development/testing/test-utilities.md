# Test Utilities & Patterns

## Backend Test Helpers

**File:** `apps/pokehub-api/src/test/test-utils.ts`

```typescript
// JWT token generation for tests
export const createTestToken = (userId: string): string => { ... };

// Mock team data factory
export const createMockTeam = (overrides?: Partial<Team>): Team => ({
  id: 'test-team-id',
  userId: 'test-user-id',
  name: 'Test Team',
  generation: 9,
  format: 'ou',
  pokemon: [createMockPokemon()],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock Pokemon data factory
export const createMockPokemon = (overrides?: Partial<PokemonInTeam>): PokemonInTeam => ({
  species: 'Pikachu',
  name: '',
  ability: 'Static',
  item: 'Light Ball',
  nature: 'Jolly',
  gender: 'M',
  level: 50,
  moves: ['Thunderbolt', 'Volt Tackle', 'Iron Tail', 'Quick Attack'],
  evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  ...overrides,
});
```

## Frontend Test Helpers

**File:** `packages/frontend/pokehub-team-builder/src/lib/test/test-utils.tsx`

```typescript
// Wrapper with all required providers
export const TestProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TeamEditorProvider>
        <TeamValidationProvider>{children}</TeamValidationProvider>
      </TeamEditorProvider>
    </QueryClientProvider>
  );
};
```

## Mock Data Factories

Use factory functions to create consistent mock data across tests:

```typescript
// Team Response DTO factory
export const createMockTeamResponse = (
  overrides?: Partial<TeamResponseDTO>
): TeamResponseDTO => ({
  id: 'team-123',
  userId: 'user-123',
  name: 'Test Team',
  generation: 9,
  format: 'ou',
  pokemon: [createMockPokemonInTeam()],
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-15').toISOString(),
  ...overrides,
});
```

Benefits:
- Consistent mock data across all tests
- Easy to override specific properties
- Type-safe with TypeScript
- Reduces boilerplate in test files

## Render with Providers Pattern

For testing components that require context providers:

```typescript
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

export function renderWithTeamViewerProvider(
  ui: React.ReactElement,
  options?: {
    queryClient?: QueryClient;
    initialFilters?: Partial<TeamViewerFiltersState>;
  }
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <TeamViewerProvider initialState={options?.initialFilters}>
        {ui}
      </TeamViewerProvider>
    </QueryClientProvider>
  );
}
```

## Integration Test Setup (Mock API Layer, Real Hooks)

Mock only the API layer while using real hooks:

```typescript
jest.mock('../api/teams-api', () => ({
  createTeamRequest: jest.fn(),
  updateTeamRequest: jest.fn(),
  deleteTeamRequest: jest.fn(),
  getUserTeams: jest.fn(),
}));

jest.mock('@pokehub/frontend/shared-auth', () => ({
  useAuthSession: jest.fn(() => ({
    data: { accessToken: 'mock-token', user: { id: 'user-123' } },
    status: 'authenticated',
  })),
}));
```

## Mocking Context with Mutable State

Use getters for dynamic mock values when testing components that consume context:

```typescript
const mockValidationState = {
  isValid: true,
  errors: [],
};

jest.mock('../context/team-editor.context', () => ({
  useTeamEditorContext: () => ({
    validation: {
      get state() { return mockValidationState; },
      get isTeamValid() { return mockValidationState.isValid; },
    },
  }),
}));

// Modify before each test
mockValidationState.isValid = false;
render(<ComponentUnderTest />);
```
