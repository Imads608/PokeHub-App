# Unit & Integration Testing Guide

## Table of Contents

- [Current Status](#current-status)
- [Testing Strategy](#testing-strategy)
- [Backend Unit Tests](#backend-unit-tests)
  - [TeamsService Tests](#teamsservice-tests)
  - [TeamsDBService Tests](#teamsdbservice-tests)
  - [Validation Pipes Tests](#validation-pipes-tests)
- [Frontend Unit Tests](#frontend-unit-tests)
  - [useTeams Hook Tests](#useteams-hook-tests)
  - [Team Validation Context Tests](#team-validation-context-tests)
  - [Component Tests](#component-tests)
- [Integration Tests](#integration-tests)
  - [Teams Controller Integration Tests](#teams-controller-integration-tests)
- [Test Utilities](#test-utilities)
- [Technical Challenges & Solutions](#technical-challenges--solutions)
- [Running Tests](#running-tests)
- [Test Statistics](#test-statistics)
- [Related Documentation](#related-documentation)

---

## Current Status

**✅ ALL UNIT & INTEGRATION TESTS PASSING**

**Test Results:**

- ✅ **Backend Unit Tests: 64 passing**
  - TeamsService: 28 tests
  - TeamsDBService: 17 tests
  - ShowdownTeamValidationPipe: 16 tests
  - ZodValidationPipe: 3 tests
- ✅ **Frontend Unit Tests: 283+ passing**
  - useTeams Hooks: Multiple suites
  - TeamValidationProvider: 23 tests
  - Existing Component Tests: ~240 tests
- ✅ **Integration Tests: 87 passing**
  - Teams Controller: Complete HTTP endpoint coverage

**Total: 434+ tests passing**

---

## Testing Strategy

### Priority Order

1. ✅ **Unit Tests** - Isolated testing of services, hooks, and components
2. ✅ **Integration Tests** - API endpoint testing with validation pipes
3. ✅ **E2E Tests** - Full user flows (see separate E2E docs)

### Coverage Level

- ✅ **Happy paths** - Normal operation scenarios
- ✅ **Error cases** - 404, 403, 401, 400 responses
- ✅ **Edge cases** - Team limit, empty states, boundary conditions
- ✅ **Validation** - Zod structural validation + Showdown format rules

---

## Backend Unit Tests

### TeamsService Tests

**File:** `apps/pokehub-api/src/teams/teams.service.spec.ts`

**Status:** ✅ Complete - 28 tests passing

**Test Cases:**

#### `createTeam`

- ✅ Should create team successfully when under limit
- ✅ Should throw ServiceError when user has 5 teams (MAX_TEAMS_PER_USER)
- ✅ Should call teamsDbService.getTeamCountByUserId before creating
- ✅ Should call teamsDbService.createTeam with correct parameters
- ✅ Should return TeamResponseDTO with all fields mapped correctly

#### `getUserTeams`

- ✅ Should return empty array when user has no teams
- ✅ Should return all teams for user
- ✅ Should map Team entities to TeamResponseDTOs correctly

#### `getTeamById`

- ✅ Should return team when user owns it
- ✅ Should throw NotFoundException when team doesn't exist
- ✅ Should throw ForbiddenException when user doesn't own team

#### `updateTeam`

- ✅ Should update team successfully when user owns it
- ✅ Should throw NotFoundException when team doesn't exist
- ✅ Should throw ForbiddenException when user doesn't own team
- ✅ Should call teamsDbService.updateTeam with correct parameters

#### `deleteTeam`

- ✅ Should delete team successfully
- ✅ Should verify ownership before deletion
- ✅ Should throw NotFoundException when team doesn't exist
- ✅ Should throw ForbiddenException when user doesn't own team

**Key Implementation Details:**

```typescript
describe('TeamsService', () => {
  let service: TeamsService;
  let teamsDbService: jest.Mocked<TeamsDBService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: TeamsDBService,
          useValue: {
            createTeam: jest.fn(),
            getTeam: jest.fn(),
            getUserTeams: jest.fn(),
            getTeamCountByUserId: jest.fn(),
            updateTeam: jest.fn(),
            deleteTeam: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    teamsDbService = module.get(TeamsDBService);
  });

  // Tests here...
});
```

---

### TeamsDBService Tests

**File:** `packages/backend/pokehub-teams-db/src/lib/teams-db.service.spec.ts`

**Status:** ✅ Complete - 17 tests passing

**Test Cases:**

#### `createTeam`

- ✅ Should insert team and return created entity
- ✅ Should throw ServiceError when insert fails

#### `getTeam`

- ✅ Should return team when found
- ✅ Should return undefined when not found

#### `getTeamsByUserId`

- ✅ Should return all teams for user
- ✅ Should return empty array when user has no teams

#### `getTeamCountByUserId`

- ✅ Should return correct count
- ✅ Should return 0 when user has no teams

#### `updateTeam`

- ✅ Should update team and return updated entity
- ✅ Should throw ServiceError when update fails
- ✅ Should update updatedAt timestamp

#### `deleteTeam`

- ✅ Should return true when deletion succeeds
- ✅ Should return false when team not found or unauthorized

**Coverage:** All CRUD operations with transaction handling, error propagation, and data transformation

---

### Validation Pipes Tests

#### ShowdownTeamValidationPipe

**File:** `apps/pokehub-api/src/teams/pipes/showdown-team-validation.pipe.spec.ts`

**Status:** ✅ Complete - 16 tests passing

**Test Cases:**

- ✅ Should pass valid legal team through
- ✅ Should throw BadRequestException for banned Pokemon
- ✅ Should throw BadRequestException for banned moves
- ✅ Should throw BadRequestException for banned abilities
- ✅ Should throw BadRequestException for banned items
- ✅ Should throw BadRequestException for Species Clause violation
- ✅ Should include slot-indexed errors in response
- ✅ Should handle invalid format gracefully

**Coverage:** Pokemon Showdown format validation, legality checks

#### ZodValidationPipe

**File:** `apps/pokehub-api/src/common/pipes/zod-validation.pipe.spec.ts`

**Status:** ✅ Complete - 3 tests passing (pre-existing)

**Test Cases:**

- ✅ Should pass valid input through unchanged
- ✅ Should throw BadRequestException for invalid input
- ✅ Should format error messages correctly with path and message

---

## Frontend Unit Tests

### useTeams Hook Tests

**File:** `packages/frontend/pokehub-team-builder/src/lib/hooks/useTeams.spec.tsx`

**Status:** ✅ Complete - Multiple test suites passing

**Test Cases:**

#### `useCreateTeam`

- ✅ Should call createTeamRequest with correct parameters
- ✅ Should invalidate teams query cache on success
- ✅ Should handle auth retry on 401
- ✅ Should return error state on failure

#### `useUpdateTeam`

- ✅ Should call updateTeamRequest with teamId and data
- ✅ Should invalidate caches on success

#### `useDeleteTeam`

- ✅ Should call deleteTeamRequest with teamId
- ✅ Should remove team from cache on success

#### `useSaveTeam`

- ✅ Should use createTeam mutation when no teamId
- ✅ Should use updateTeam mutation when teamId provided

**Coverage:** React Query integration, auth retry logic, error handling

---

### Team Validation Context Tests

**File:** `packages/frontend/pokehub-team-builder/src/lib/context/team-validation-context/team-validation.provider.spec.tsx`

**Status:** ✅ Complete - 23 tests passing

**Test Cases:**

- ✅ Should initialize with isReady: false
- ✅ Should set isReady: true after validation module loads
- ✅ Should run Zod validation on team changes
- ✅ Should run Showdown validation on team changes
- ✅ Should merge errors from both validators
- ✅ Should provide correct isTeamValid state
- ✅ Should map errors to correct Pokemon slots

**Coverage:** Dynamic module loading, Zod + Showdown validation, error aggregation, helper functions

---

### Component Tests

#### PokemonSelector

**File:** `packages/frontend/pokehub-team-builder/src/lib/team-editor/pokemon-selector/pokemon-selector.spec.tsx`

**Test Cases:**

- ✅ Should filter banned Pokemon from list
- ✅ Should filter by search term
- ✅ Should filter by type
- ✅ Should handle doubles format detection
- ✅ Should call onPokemonSelected with correct species

#### TeamConfigurationSection

**File:** `packages/frontend/pokehub-team-builder/src/lib/team-editor/team-configuration/team-configuration-section.spec.tsx`

**Test Cases:**

- ✅ Should validate team name length
- ✅ Should show confirmation when changing generation with Pokemon
- ✅ Should clear team after generation change confirmation
- ✅ Should disable save when team invalid
- ✅ Should show validation summary

---

## Integration Tests

### Teams Controller Integration Tests

**File:** `apps/pokehub-api/src/teams/teams.controller.spec.ts`

**Status:** ✅ Complete - 87 tests passing

**Setup:**

- Uses Test.createTestingModule with AppModule
- Mocks database service to avoid real DB dependency
- Creates test JWT tokens for authentication

**Test Coverage:**

#### POST /api/teams

- ✅ Should create team with valid data (201)
- ✅ Should return 401 without auth token
- ✅ Should return 400 with invalid team data (Zod validation)
- ✅ Should return 400 with illegal Pokemon (Showdown validation)
- ✅ Should return 400 when user has 5 teams (limit reached)

#### GET /api/teams

- ✅ Should return user's teams (200)
- ✅ Should return empty array when no teams
- ✅ Should return 401 without auth token

#### GET /api/teams/:id

- ✅ Should return team when user owns it (200)
- ✅ Should return 404 when team not found
- ✅ Should return 403 when user doesn't own team
- ✅ Should return 401 without auth token

#### PUT /api/teams/:id

- ✅ Should update team with valid data (200)
- ✅ Should return 400 with invalid data
- ✅ Should return 404 when team not found
- ✅ Should return 403 when user doesn't own team

#### DELETE /api/teams/:id

- ✅ Should delete team (204)
- ✅ Should return 404 when team not found
- ✅ Should return 403 when user doesn't own team
- ✅ Should return 401 without auth token

**Coverage:** All HTTP endpoints with authentication guard integration, validation pipes integration (Zod + Showdown), and error responses

---

## Test Utilities

### Backend Test Helpers

**File:** `apps/pokehub-api/src/test/test-utils.ts`

```typescript
import { Team } from '@pokehub/backend/pokehub-teams-db';
import { PokemonInTeam } from '@pokehub/shared/pokemon-types';

// JWT token generation for tests
export const createTestToken = (userId: string): string => {
  // Implementation using JWT library
};

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
export const createMockPokemon = (
  overrides?: Partial<PokemonInTeam>
): PokemonInTeam => ({
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

### Frontend Test Helpers

**File:** `packages/frontend/pokehub-team-builder/src/lib/test/test-utils.tsx`

```typescript
import { TeamEditorProvider } from '../context/team-editor-context/team-editor.provider';
import { TeamValidationProvider } from '../context/team-validation-context/team-validation.provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

// Mock team state factory
export const createMockTeamState = () => ({
  teamName: 'Test Team',
  generation: 9,
  format: 'ou',
  teamPokemon: [],
});
```

---

## Technical Challenges & Solutions

### 1. ESM Module Compatibility (Next-Auth)

**Problem:** Jest couldn't handle Next-auth ESM modules natively.

**Solution:**

Updated `jest.config.ts` with transformIgnorePatterns:

```typescript
transformIgnorePatterns: [
  '/node_modules/(?!(next-auth|@auth/core|jose|oauth4webapi|@panva|preact)/)',
];
```

Used type-only imports in `global-next-types/src/lib/next-auth.d.ts`

### 2. Cross-Domain Dependencies

**Problem:** Backend importing from frontend packages caused circular dependencies.

**Solution:**

- Created `packages/shared/shared-request-context` package
- Moved `RequestContext` interface to shared location
- Updated imports in affected packages

### 3. React Query Async State Testing

**Problem:** Mutation state updates happen asynchronously after `act()` blocks.

**Solution:**

Used `waitFor()` for state updates:

```typescript
await act(async () => {
  await result.current.mutateAsync(data);
});

await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});
```

### 4. Pokemon Showdown Validation in Tests

**Problem:** Test data needed to pass both Zod and Showdown validation.

**Solution:**

- Used Level 100 Pokemon (standard for competitive formats)
- Valid movesets for each species
- Proper EV/IV distributions

Example:

```typescript
{
  species: 'Pikachu',
  level: 100, // Standard for OU
  moves: ['Thunderbolt', 'Volt Switch', 'Nuzzle', 'Quick Attack'],
  evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
}
```

### 5. Jest Mock Patterns with TypeScript

**Problem:** Maintaining type safety while mocking.

**Solution:**

Use factory functions in jest.mock() with proper typing:

```typescript
jest.mock('../api/teams-api', () => ({
  createTeamRequest: jest.fn(),
}));

const mockCreateTeamRequest = createTeamRequest as jest.Mock;
```

### 6. Authorization Bug in DELETE Endpoint

**Problem:** DELETE endpoint returned `404 Not Found` instead of `403 Forbidden` when user tried to delete another user's team.

**Root Cause:** The `deleteTeam` method didn't verify ownership before attempting deletion. The database method used an AND condition, making "team doesn't exist" and "user doesn't own team" indistinguishable.

**Fix:** Added ownership verification before deletion:

```typescript
// apps/pokehub-api/src/teams/teams.service.ts
async deleteTeam(teamId: string, userId: string): Promise<void> {
  // Verify ownership first
  const existingTeam = await this.teamsDbService.getTeam(teamId);

  if (!existingTeam) {
    throw new NotFoundException('Team not found');
  }

  if (existingTeam.userId !== userId) {
    throw new ForbiddenException('You do not have access to this team');
  }

  // Now safe to delete
  await this.teamsDbService.deleteTeam(teamId, userId);
}
```

---

## Running Tests

### Backend Tests

```bash
# All backend unit tests
nx test pokehub-api

# Specific service tests
nx test pokehub-api --testPathPattern=teams.service

# Database package tests
nx test backend-pokehub-teams-db

# With coverage
nx test pokehub-api --coverage
```

### Frontend Tests

```bash
# All frontend team builder tests
nx test frontend-pokehub-team-builder

# Specific hook tests
nx test frontend-pokehub-team-builder --testPathPattern=useTeams

# With coverage
nx test frontend-pokehub-team-builder --coverage
```

### Integration Tests

```bash
# Teams controller integration tests
nx test pokehub-api --testPathPattern=teams.controller

# All integration tests
nx test pokehub-api
```

### All Tests

```bash
# Run all unit and integration tests
nx run-many -t test

# Run all tests with coverage
nx run-many -t test --coverage

# Run tests for affected projects only
nx affected -t test
```

---

## Test Statistics

| Component                  | Tests                  | Status |
| -------------------------- | ---------------------- | ------ |
| **Backend Unit Tests**     | **64**                 | **✅** |
| TeamsService               | 28                     | ✅     |
| TeamsDBService             | 17                     | ✅     |
| ShowdownTeamValidationPipe | 16                     | ✅     |
| ZodValidationPipe          | 3                      | ✅     |
| **Frontend Unit Tests**    | **283+**               | **✅** |
| useTeams Hooks             | Multiple suites        | ✅     |
| TeamValidationProvider     | 23                     | ✅     |
| Existing Component Tests   | ~240                   | ✅     |
| **Integration Tests**      | **87**                 | **✅** |
| Teams Controller           | 87                     | ✅     |
| **TOTAL**                  | **434+ (all passing)** | **✅** |

---

## Related Documentation

- [Backend E2E Testing Architecture](./backend-e2e-testing.md)
- [Frontend E2E Testing Architecture](./frontend-e2e-testing.md)
- [Team Builder Feature](../features/team-builder.md)
- [Team Persistence](../features/team-persistence.md)
- [Code Style and Patterns](../code-style-and-patterns.md)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/)

---

**Last Updated:** December 13, 2025  
**Status:** ✅ All Unit & Integration Tests Passing  
**Test Coverage:** 434+ tests covering services, hooks, components, and HTTP endpoints  
**Maintenance:** Active - tests run on every commit via CI
