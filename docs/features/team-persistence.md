# Team Persistence Feature Documentation

## Table of Contents

- [Overview](#overview)
- [User Flow](#user-flow)
- [Architecture](#architecture)
  - [High-Level System Design](#high-level-system-design)
  - [Component Structure](#component-structure)
- [API Endpoints](#api-endpoints)
  - [POST /teams](#post-teams)
  - [GET /teams](#get-teams)
  - [GET /teams/:id](#get-teamsid)
  - [PUT /teams/:id](#put-teamsid)
  - [DELETE /teams/:id](#delete-teamsid)
- [Database Design](#database-design)
  - [Decision: PostgreSQL + JSONB](#decision-postgresql--jsonb)
  - [Performance Expectations](#performance-expectations)
  - [Teams Table Schema](#teams-table-schema)
  - [JSONB Structure](#jsonb-structure-pokemon-column)
  - [Database Indexes](#database-indexes)
  - [Database Constraints](#database-constraints)
- [Validation Architecture](#validation-architecture)
  - [Two-Layer Validation Approach](#two-layer-validation-approach)
  - [Request Flow](#request-flow)
  - [Validation Constraints](#validation-constraints)
- [Zod Schema Architecture](#zod-schema-architecture)
  - [Single Source of Truth](#single-source-of-truth)
  - [Schema Hierarchy](#schema-hierarchy)
- [Frontend Integration](#frontend-integration)
  - [API Client Functions](#api-client-functions)
  - [TanStack Query Hooks](#tanstack-query-hooks)
  - [Auth Pattern](#auth-pattern)
  - [Team Name Validation UI](#team-name-validation-ui)
- [Data Flow](#data-flow)
  - [Save Team Flow](#save-team-flow)
  - [Load Teams Flow](#load-teams-flow)
- [Key Design Decisions](#key-design-decisions)
- [Security](#security)
- [File Locations](#file-locations)
- [Dependencies](#dependencies)
- [Testing](#testing)
- [Future Enhancements](#future-enhancements)
- [Changelog](#changelog)

---

## Overview

The Team Persistence feature enables users to save, load, update, and delete their Pokemon teams created in the Team Builder. Teams are stored in PostgreSQL using JSONB for optimal performance with document-centric access patterns while maintaining relational integrity with the users table.

**Status**: Complete and Production-Ready

**Key Technologies**:

- PostgreSQL with JSONB storage
- Drizzle ORM for type-safe database operations
- NestJS REST API with JWT authentication
- TanStack Query for frontend data synchronization
- Zod schema validation
- Pokemon Showdown format validation via `@pkmn/sim`

## User Flow

```
Team Builder → Configure Team → Save Team → Database
                    ↓
            Load Saved Teams → Edit Team → Update Team
                    ↓
                Delete Team
```

## Architecture

### High-Level System Design

```
┌──────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Team Builder UI (pokehub-team-builder)              │    │
│  │  - TeamEditor component                              │    │
│  │  - Team configuration & Pokemon editing              │    │
│  └──────────────────────────────────────────────────────┘    │
│                      ↕ TanStack Query Hooks                  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Team Data Hooks                                     │    │
│  │  - useSaveTeam()    - useUpdateTeam()                │    │
│  │  - useLoadTeams()   - useDeleteTeam()                │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                            ↕
                    HTTP REST API (JWT)
                            ↕
┌──────────────────────────────────────────────────────────────┐
│                       Backend Layer                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Validation Pipes (before controller)                │    │
│  │  ┌──────────────────┐  ┌──────────────────────────┐  │    │
│  │  │ ZodValidation    │→ │ ShowdownTeamValidation   │  │    │
│  │  │ Pipe             │  │ Pipe                     │  │    │
│  │  │ (structural:     │  │ (@pkmn/sim TeamValidator,│  │    │
│  │  │  types, ranges,  │  │  format rules, bans)     │  │    │
│  │  │  required)       │  │                          │  │    │
│  │  └──────────────────┘  └──────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  API Layer (pokehub-api/src/teams/)                  │    │
│  │  ┌──────────┐  ┌────────────────────────────────┐    │    │
│  │  │Controller│→ │ Service (business logic)       │    │    │
│  │  │  (REST)  │  │ - ownership checks             │    │    │
│  │  │          │  │ - delegates to DB layer        │    │    │
│  │  └──────────┘  └────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Database Layer (backend/pokehub-teams-db)           │    │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐     │    │
│  │  │ Schema   │  │ DB       │  │ Module          │     │    │
│  │  │(Drizzle) │  │ Service  │  │ (DI config)     │     │    │
│  │  │          │  │(CRUD ops)│  │                 │     │    │
│  │  └──────────┘  └──────────┘  └─────────────────┘     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Shared Packages                                     │    │
│  │  - @pokehub/shared/pokemon-types                     │    │
│  │    (types, Zod schemas, DTOs)                        │    │
│  │  - @pokehub/shared/pokemon-showdown-validation       │    │
│  │    (validateTeamForFormat using @pkmn/sim)           │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                            ↕
                      PostgreSQL
                 (teams table with JSONB)
```

### Component Structure

#### Backend Packages

```
packages/backend/pokehub-teams-db/
├── src/
│   ├── lib/
│   │   ├── schema/
│   │   │   └── team.schema.ts          # Drizzle schema definition
│   │   ├── teams-db.service.ts         # Database CRUD operations
│   │   └── teams-db.module.ts          # NestJS module configuration
│   └── index.ts
├── project.json
├── tsconfig.json
└── tsconfig.lib.json
```

#### API Layer

```
apps/pokehub-api/src/teams/
├── pipes/
│   └── showdown-team-validation.pipe.ts  # Pokemon Showdown format validation
├── teams.module.ts                       # Module registration
├── teams.service.interface.ts            # Service interface definition
├── teams.service.ts                      # Business logic
├── teams.service.provider.ts             # DI provider configuration
├── teams.controller.ts                   # REST endpoints
└── index.ts
```

#### Shared DTOs

```
packages/shared/pokemon-types/src/lib/dtos/
├── create-team.dto.ts      # POST request payload
├── update-team.dto.ts      # PUT request payload
└── team-response.dto.ts    # API response format
```

#### Frontend Files

```
packages/frontend/pokehub-team-builder/src/lib/
├── api/
│   └── teams-api.ts                      # API client functions
├── hooks/
│   └── useTeams.ts                       # TanStack Query mutation hooks
└── team-editor/
    └── team-configuration/
        └── team-configuration-section.tsx  # Save button with validation
```

## API Endpoints

### Base URL

```
http://localhost:3000/api (development)
https://pokehub.app/api (production)
```

### Authentication

All endpoints require JWT authentication via Bearer token in Authorization header:

```
Authorization: Bearer <ACCESS_TOKEN>
```

### Endpoints Summary

| Method | Endpoint     | Description          |
| ------ | ------------ | -------------------- |
| POST   | `/teams`     | Create new team      |
| GET    | `/teams`     | Get all user's teams |
| GET    | `/teams/:id` | Get specific team    |
| PUT    | `/teams/:id` | Update team          |
| DELETE | `/teams/:id` | Delete team          |

---

### POST /teams

**Description**: Create a new team for the authenticated user.

**Request**:

```typescript
POST /teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My OU Team",
  "generation": 9,
  "format": "ou",
  "pokemon": [
    {
      "species": "Garchomp",
      "name": "Chompy",
      "ability": "Rough Skin",
      "item": "Choice Scarf",
      "nature": "Jolly",
      "gender": "M",
      "level": 50,
      "moves": ["Earthquake", "Outrage", "Stone Edge", "Fire Fang"],
      "evs": { "hp": 0, "atk": 252, "def": 4, "spa": 0, "spd": 0, "spe": 252 },
      "ivs": { "hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31 }
    }
  ]
}
```

**Response**:

```typescript
201 Created

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "My OU Team",
  "generation": 9,
  "format": "ou",
  "pokemon": [ /* ... */ ],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Validation Errors**:

```typescript
400 Bad Request

{
  "statusCode": 400,
  "message": [
    "name must be between 1 and 100 characters",
    "pokemon array must contain 1-6 Pokemon"
  ],
  "error": "Bad Request"
}
```

---

### GET /teams

**Description**: Get all teams for the authenticated user, ordered by creation date (newest first).

**Request**:

```typescript
GET / teams;
Authorization: Bearer<token>;
```

**Response**:

```typescript
200 OK

[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "My OU Team",
    "generation": 9,
    "format": "ou",
    "pokemon": [ /* ... */ ],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "VGC Doubles Team",
    "generation": 9,
    "format": "vgc2024rege",
    "pokemon": [ /* ... */ ],
    "createdAt": "2025-01-14T15:20:00.000Z",
    "updatedAt": "2025-01-14T15:20:00.000Z"
  }
]
```

---

### GET /teams/:id

**Description**: Get a specific team by ID. User can only access their own teams.

**Request**:

```typescript
GET /teams/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response**:

```typescript
200 OK

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "My OU Team",
  "generation": 9,
  "format": "ou",
  "pokemon": [ /* ... */ ],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Errors**:

```typescript
404 Not Found

{
  "statusCode": 404,
  "message": "Team with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

---

### PUT /teams/:id

**Description**: Update an existing team. Full replacement semantics - requires complete team data.

**Request**:

```typescript
PUT /teams/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Team Name",
  "generation": 9,
  "format": "ou",
  "pokemon": [ /* complete Pokemon array */ ]
}
```

**Response**:

```typescript
200 OK

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "Updated Team Name",
  "generation": 9,
  "format": "ou",
  "pokemon": [ /* ... */ ],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T11:45:00.000Z"
}
```

---

### DELETE /teams/:id

**Description**: Delete a team. User can only delete their own teams.

**Request**:

```typescript
DELETE /teams/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response**:

```typescript
204 No Content
```

## Database Design

### Decision: PostgreSQL + JSONB

**Rationale**:

- **Document-centric access**: Teams are always loaded/saved as complete units
- **Simple queries**: 95% of operations are "get team by ID" or "list user's teams"
- **Matches frontend structure**: No impedance mismatch between API and UI
- **Performance**: Faster for our access patterns (single SELECT vs multiple JOINs)
- **Infrequent updates**: Users save occasionally, not continuously

### Performance Expectations

| Operation     | Expected Latency |
| ------------- | ---------------- |
| Load 1 team   | < 1ms            |
| Load 10 teams | < 5ms            |
| Save team     | < 2ms            |
| Update team   | < 2ms            |

### Teams Table Schema

```typescript
// packages/backend/pokehub-teams-db/src/lib/schema/team.schema.ts
import { usersTable } from '@pokehub/backend/pokehub-users-db';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    generation: integer('generation').notNull(),
    format: varchar('format', { length: 50 }).notNull(), // Showdown format ID
    pokemon: jsonb('pokemon').notNull().$type<PokemonInTeam[]>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_teams_user_id').on(table.userId),
    index('idx_teams_created_at').on(table.createdAt),
    index('idx_teams_user_list').on(table.userId, table.createdAt.desc()),
  ]
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
```

### JSONB Structure (pokemon column)

```typescript
type PokemonInTeam = {
  species: string; // 'Pikachu'
  name: string; // Custom nickname
  ability: string; // 'Static'
  item: string; // 'Light Ball'
  nature: string; // 'Jolly'
  gender: 'M' | 'F' | 'N';
  level: number; // 1-100
  moves: string[]; // Array of 1-4 move names
  evs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  ivs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
};
```

### Database Indexes

1. **`idx_teams_user_id`** - Fast user team lookups
2. **`idx_teams_created_at`** - Sorting by creation date
3. **`idx_teams_user_list`** - Composite index `(userId, createdAt DESC)` for list queries

### Database Constraints

- **Primary Key**: UUID for team ID (random generation)
- **Foreign Key**: userId references users.id with CASCADE delete
- **Not Null**: All fields except custom nickname

## Validation Architecture

### Two-Layer Validation Approach

The system uses two complementary validation layers:

#### 1. Zod Structural Validation (`ZodValidationPipe`)

**Location**: `apps/pokehub-api/src/common/pipes/zod-validation.pipe.ts`

**Purpose**: Validates data structure and types

**Checks**:

- Required fields present
- Type checking (string, number, array, etc.)
- Range validation (EVs 0-252, IVs 0-31, level 1-100)
- Array length constraints (1-6 Pokemon, 1-4 moves)

#### 2. Pokemon Showdown Validation (`ShowdownTeamValidationPipe`)

**Location**: `apps/pokehub-api/src/teams/pipes/showdown-team-validation.pipe.ts`

**Purpose**: Validates against competitive format rules

**Uses**: `@pokehub/shared/pokemon-showdown-validation` package with `@pkmn/sim`

**Checks**:

- Species legality for format
- Move legality (learnable moves, not banned)
- Ability legality
- Item legality
- Team composition rules (clauses, bans, restrictions)

### Request Flow

```
Request Body → ZodValidationPipe → ShowdownTeamValidationPipe → Controller
```

### Validation Constraints

| Field             | Constraint                    |
| ----------------- | ----------------------------- |
| `name`            | 1-100 characters              |
| `generation`      | Integer 1-9                   |
| `format`          | 1-50 characters               |
| `pokemon`         | Array of 1-6 Pokemon          |
| `pokemon[].name`  | Max 12 characters (nickname)  |
| `pokemon[].level` | Integer 1-100                 |
| `pokemon[].moves` | Array of 1-4 moves            |
| `pokemon[].evs`   | 0-252 per stat, 510 total max |
| `pokemon[].ivs`   | 0-31 per stat                 |

## Zod Schema Architecture

### Single Source of Truth

`pokemonTeamSchema` in `pokemon-team.validation.ts` is the source of truth for team validation, used by both frontend and backend:

```
pokemonTeamSchema (source of truth)
    ↓
CreateTeamDTOSchema = pokemonTeamSchema
    ↓
UpdateTeamDTOSchema = CreateTeamDTOSchema
```

### Schema Hierarchy

| Schema                  | Location                     | Purpose                                                                  |
| ----------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| `pokemonInTeamSchema`   | `pokemon-team.validation.ts` | Validates individual Pokemon                                             |
| `pokemonTeamSchema`     | `pokemon-team.validation.ts` | Validates entire team (uses `pokemonInTeamSchema`)                       |
| `CreateTeamDTOSchema`   | `dtos/create-team.dto.ts`    | API DTO - references `pokemonTeamSchema`                                 |
| `UpdateTeamDTOSchema`   | `dtos/update-team.dto.ts`    | API DTO - references `CreateTeamDTOSchema`                               |
| `TeamResponseDTOSchema` | `dtos/team-response.dto.ts`  | API response - extends `CreateTeamDTOSchema` with id, userId, timestamps |

### Why This Architecture?

1. **Single source of truth** - Changes to validation rules only need to be made in one place
2. **Frontend/Backend alignment** - Both use the same schemas from `@pokehub/shared/pokemon-types`
3. **Type safety** - `z.infer<typeof schema>` derives TypeScript types from Zod schemas
4. **No drift** - DTOs reference the base schema rather than duplicating it

## Frontend Integration

### API Client Functions

**Location**: `packages/frontend/pokehub-team-builder/src/lib/api/teams-api.ts`

```typescript
import { withAuthRetry } from '@pokehub/frontend/shared-data-provider';

export const createTeamRequest = async (
  accessToken: string,
  data: CreateTeamDTO
): Promise<TeamResponseDTO> => {
  // POST /teams with auth header
};

export const updateTeamRequest = async (
  accessToken: string,
  teamId: string,
  data: UpdateTeamDTO
): Promise<TeamResponseDTO> => {
  // PUT /teams/:id with auth header
};

export const deleteTeamRequest = async (
  accessToken: string,
  teamId: string
): Promise<void> => {
  // DELETE /teams/:id with auth header
};
```

### TanStack Query Hooks

**Location**: `packages/frontend/pokehub-team-builder/src/lib/hooks/useTeams.ts`

```typescript
export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();

  return useMutation({
    mutationFn: async (data: CreateTeamDTO) => {
      const response = await withAuthRetry(session?.accessToken, (token) =>
        createTeamRequest(token, data)
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useUpdateTeam = () => {
  // Similar pattern for updates
};

export const useDeleteTeam = () => {
  // Similar pattern for deletes
};

export const useSaveTeam = () => {
  // Smart hook that calls create or update based on team.id
};
```

### Auth Pattern

Hooks use `useAuthSession()` internally to get access token and `withAuthRetry()` for automatic token refresh on 401:

```typescript
const { data: session } = useAuthSession();
const response = await withAuthRetry(accessToken, (token) =>
  createTeamRequest(token, data)
);
```

### Team Name Validation UI

The save button and team name input provide visual feedback for validation:

- **Red border** on team name input when validation fails
- **Error message** displayed below input
- **Save button disabled** when:
  - No changes detected
  - Validation errors exist
  - Save operation in progress

## Data Flow

### Save Team Flow

```
User clicks "Save Team" in TeamEditor
  ↓
Frontend validates team with Zod schema
  ↓
useSaveTeam() hook determines create vs update
  ↓
POST /teams or PUT /teams/:id
  ↓
JWT authentication middleware verifies user
  ↓
ZodValidationPipe validates structure
  ↓
ShowdownTeamValidationPipe validates format rules
  ↓
TeamsController receives validated DTO
  ↓
TeamsService validates ownership & business rules
  ↓
TeamsDBService inserts/updates PostgreSQL
  ↓
Database stores team with JSONB pokemon array
  ↓
Response with TeamResponseDTO (includes id, timestamps)
  ↓
TanStack Query updates cache & invalidates queries
  ↓
UI updates with saved team confirmation
```

### Load Teams Flow

```
User opens Team Builder
  ↓
useUserTeams() hook calls GET /teams
  ↓
JWT authentication middleware verifies user
  ↓
TeamsController extracts user from token
  ↓
TeamsService calls TeamsDBService
  ↓
TeamsDBService queries: SELECT * FROM teams WHERE user_id = $1
  ↓
PostgreSQL returns teams with JSONB pokemon data
  ↓
Response with TeamResponseDTO[]
  ↓
TanStack Query caches results
  ↓
UI displays team list for selection
```

## Key Design Decisions

### 1. PostgreSQL + JSONB (not MongoDB)

See [Database Design](#database-design) section for full rationale.

### 2. Types in pokemon-types Package

- Reuse existing `PokemonInTeam`, `PokemonTeam` from `@pokehub/shared/pokemon-types`
- DTOs added alongside types for cohesion
- Single source of truth for both frontend and backend

### 3. Single `format` Field

- Showdown format ID (e.g., `'ou'`, `'vgc2024rege'`) - no separate tier field
- Full Showdown format ID computed as `gen${generation}${format}`
- Simplifies format handling and validation

### 4. Database Type Safety

- Using `NodePgDatabase<typeof schema>` (not `PostgresJsDatabase`) to match `node-postgres` driver
- `import * as schema` pattern for full Drizzle type support
- Foreign key to `usersTable` with CASCADE delete

### 5. Interface-First Services

- Following existing UsersService pattern
- Service token constants (`TEAMS_SERVICE`, `TEAMS_DB_SERVICE`)
- Provider pattern for DI configuration

### 6. Full Replacement Updates

- `UpdateTeamDTO` uses same schema as `CreateTeamDTO`
- No partial updates - complete team data required on PUT
- Simplifies validation and prevents inconsistent state

## Security

### Authentication

- All endpoints require valid JWT access token
- Token validation via `TokenAuthGuard` with `ACCESS_TOKEN` type

### Authorization

- Users can only access their own teams
- User ID extracted from JWT payload
- All queries filtered by userId
- Ownership verified in service layer

### Input Validation

- Zod schemas validate all request data
- Pokemon Showdown validation prevents illegal teams
- Length limits on all string fields

## File Locations

### Backend Files

```
packages/backend/pokehub-teams-db/
├── src/
│   ├── lib/
│   │   ├── schema/team.schema.ts
│   │   ├── teams-db.service.ts
│   │   └── teams-db.module.ts
│   └── index.ts

apps/pokehub-api/src/
├── teams/
│   ├── pipes/
│   │   └── showdown-team-validation.pipe.ts
│   ├── teams.controller.ts
│   ├── teams.service.ts
│   ├── teams.service.interface.ts
│   ├── teams.service.provider.ts
│   └── teams.module.ts
└── common/
    └── pipes/
        └── zod-validation.pipe.ts
```

### Shared Files

```
packages/shared/pokemon-types/src/lib/
├── dtos/
│   ├── create-team.dto.ts
│   ├── update-team.dto.ts
│   └── team-response.dto.ts
├── pokemon-team.ts
├── pokemon-team.validation.ts
└── index.ts
```

### Frontend Files

```
packages/frontend/pokehub-team-builder/src/lib/
├── api/
│   └── teams-api.ts
├── hooks/
│   └── useTeams.ts
└── team-editor/
    └── team-configuration/
        ├── team-configuration-section.tsx
        └── team-configuration-section.spec.tsx
```

### Database Files

```
drizzle/
└── XXXX_create_teams_table.sql (generated by Drizzle)
```

## Dependencies

### Existing Packages Used

All required packages are already installed:

- `drizzle-orm` - Database ORM
- `postgres` / `pg` - PostgreSQL driver
- `@nestjs/common` - NestJS framework
- `@tanstack/react-query` - Data fetching
- `zod` - Schema validation
- `@pkmn/sim` - Pokemon Showdown validation

### Internal Packages

**Backend**:

- `@pokehub/backend/pokehub-postgres` - Database connection
- `@pokehub/backend/pokehub-users-db` - User schema for FK
- `@pokehub/backend/shared-auth-utils` - JWT guards and decorators
- `@pokehub/backend/shared-logger` - Logging

**Frontend**:

- `@pokehub/frontend/pokehub-data-provider` - API client
- `@pokehub/frontend/shared-auth` - Authentication hooks

**Shared**:

- `@pokehub/shared/pokemon-types` - Types and DTOs
- `@pokehub/shared/pokemon-showdown-validation` - Format validation
- `@pokehub/shared/shared-auth-models` - UserTokenPayload type

## Testing

### Test Coverage

- **237 tests passing** across the pokehub-team-builder package
- **11 test suites** covering team configuration, validation, and save functionality

### Backend Unit Tests

```typescript
describe('TeamsDBService', () => {
  describe('createTeam', () => {
    it('should create a team', async () => {
      /* ... */
    });
  });

  describe('getUserTeams', () => {
    it('should return user teams', async () => {
      /* ... */
    });
  });

  // More tests...
});
```

### Frontend Hook Tests

```typescript
describe('useTeamPersistence', () => {
  describe('useSaveTeam', () => {
    it('should save team and invalidate queries', async () => {
      /* ... */
    });
  });

  // More tests...
});
```

## Future Enhancements

### Planned Features

1. **Team Loading UI** - Server-side team fetching and display in Team Builder
2. **Team List View** - Browse and manage saved teams
3. **Integration Tests** - API endpoint testing with test database
4. **E2E Tests** - Full user flow testing

### Potential Features

1. **Team Sharing** - Add `isPublic` boolean for public team browsing
2. **Import/Export** - Pokemon Showdown format import/export
3. **Team Templates** - Save and load team templates
4. **Team Analytics** - Most popular Pokemon per tier
5. **Team Versioning** - Track changes to teams over time
6. **Collaborative Editing** - Real-time team editing with others

## Changelog

### Initial Release (Complete)

- Backend API with full CRUD operations
- Database schema with proper indexes and constraints
- Two-layer validation (Zod + Showdown format validation)
- Frontend hooks for team management (`useCreateTeam`, `useUpdateTeam`, `useDeleteTeam`, `useSaveTeam`)
- Team Builder save functionality with validation feedback
- Team name validation with visual error indicators (red border + error message)
- Comprehensive test coverage (237 tests passing)
- Auth integration with automatic token refresh
