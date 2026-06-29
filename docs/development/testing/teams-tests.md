# Teams Tests

## Backend Unit Tests

### TeamsService

**File:** `apps/pokehub-api/src/teams/teams.service.spec.ts`

Covers all CRUD operations with ownership verification:
- `createTeam` — success, team limit enforcement, correct parameter passing
- `getUserTeams` — empty state, mapping entities to DTOs
- `getTeamById` — ownership check, 404/403 error cases
- `updateTeam` — ownership check, correct update parameters
- `deleteTeam` — ownership verification before deletion, 404/403 error cases

### TeamsDBService

**File:** `packages/backend/pokehub-teams-db/src/lib/teams-db.service.spec.ts`

Covers database operations with error handling:
- `createTeam` — insert + return, failure propagation
- `getTeam` — found/not found
- `getTeamsByUserId` — all teams, empty state
- `getTeamCountByUserId` — correct count, zero count
- `updateTeam` — update + return, timestamp update, failure propagation
- `deleteTeam` — success/failure (not found or unauthorized)

### Validation Pipes

**ShowdownTeamValidationPipe** (`apps/pokehub-api/src/teams/pipes/showdown-team-validation.pipe.spec.ts`)

Covers Pokemon Showdown format validation and legality checks:
- Valid teams pass through
- Banned Pokemon, moves, abilities, items rejected
- Species Clause violation detected
- Slot-indexed errors in response
- Invalid format handling

**ZodValidationPipe** (`apps/pokehub-api/src/common/pipes/zod-validation.pipe.spec.ts`)

- Valid input passes unchanged, invalid input throws BadRequestException, error message formatting

## Frontend Unit Tests

### useTeams Hooks

**File:** `packages/frontend/pokehub-team-builder/src/lib/hooks/useTeams.spec.tsx`

Covers React Query integration and auth retry logic:
- `useCreateTeam` — API call, cache invalidation, auth retry on 401, error state
- `useUpdateTeam` — API call with teamId, cache invalidation
- `useDeleteTeam` — API call, cache removal
- `useSaveTeam` — create vs update mutation routing

### Team Validation Context

**File:** `packages/frontend/pokehub-team-builder/src/lib/context/team-validation-context/team-validation.provider.spec.tsx`

Covers dynamic module loading and dual validation:
- Initialization state (isReady: false → true)
- Zod and Showdown validation on team changes
- Error merging from both validators
- isTeamValid state, slot-mapped errors

### Component Tests

**PokemonSelector** (`packages/frontend/pokehub-team-builder/src/lib/team-editor/pokemon-selector/pokemon-selector.spec.tsx`)
- Banned Pokemon filtering, search/type filtering, doubles format detection, selection callback

**TeamConfigurationSection** (`packages/frontend/pokehub-team-builder/src/lib/team-editor/team-configuration/team-configuration-section.spec.tsx`)
- Team name validation, generation change confirmation, save button state, validation summary

## Integration Tests

### Teams Controller

**File:** `apps/pokehub-api/src/teams/teams.controller.spec.ts`

Full HTTP endpoint coverage with auth guard and validation pipe integration:
- `POST /api/teams` — create with valid data, 401/400 (Zod + Showdown), team limit
- `GET /api/teams` — user's teams, empty array, 401
- `GET /api/teams/:id` — ownership, 404/403/401
- `PUT /api/teams/:id` — valid update, 400/404/403
- `DELETE /api/teams/:id` — success, 404/403/401
