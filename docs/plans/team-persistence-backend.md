# Team Persistence Backend Plan

## Summary

Implement backend team persistence from scratch on `main` branch:

1. **Create database package** - `@pokehub/backend/pokehub-teams-db` with Drizzle schema ✅
2. **Create DTOs** - Add to `@pokehub/shared/pokemon-types` (types already exist there) ✅
3. **Implement API layer** - Teams controller, service, and module ✅
4. **Update documentation** - Reflect implementation ✅

## Implementation Status

| Component                           | Status                                                    |
| ----------------------------------- | --------------------------------------------------------- |
| `@pokehub/shared/pokemon-types`     | ✅ Has `PokemonInTeam`, `PokemonTeam`, validation schemas, DTOs |
| `@pokehub/backend/pokehub-teams-db` | ✅ Implemented with Drizzle schema and DB service         |
| `apps/pokehub-api/src/teams/`       | ✅ Controller, Service, Module implemented                |
| DTOs (CreateTeamDTO, etc.)          | ✅ Created in pokemon-types package                       |
| ZodValidationPipe                   | ✅ Created in common/pipes                                |
| ShowdownTeamValidationPipe          | ✅ Created in teams/pipes                                 |

**Types in `pokemon-types` use correct structure:**

- `format: string` (Showdown format ID, no tier field)
- Validation schemas match frontend

---

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

| Schema | Location | Purpose |
|--------|----------|---------|
| `pokemonInTeamSchema` | `pokemon-team.validation.ts` | Validates individual Pokemon |
| `pokemonTeamSchema` | `pokemon-team.validation.ts` | Validates entire team (uses `pokemonInTeamSchema`) |
| `CreateTeamDTOSchema` | `dtos/create-team.dto.ts` | API DTO - references `pokemonTeamSchema` |
| `UpdateTeamDTOSchema` | `dtos/update-team.dto.ts` | API DTO - references `CreateTeamDTOSchema` |
| `TeamResponseDTOSchema` | `dtos/team-response.dto.ts` | API response - extends `CreateTeamDTOSchema` with id, userId, timestamps |

### Validation Constraints

| Field | Constraint |
|-------|------------|
| `name` | 1-100 characters |
| `generation` | Integer 1-9 |
| `format` | 1-50 characters |
| `pokemon` | Array of 1-6 Pokemon |
| `pokemon[].name` | Max 12 characters (nickname) |
| `pokemon[].level` | Integer 1-100 |
| `pokemon[].moves` | Array of 1-4 moves |
| `pokemon[].evs` | 0-252 per stat, 510 total max |
| `pokemon[].ivs` | 0-31 per stat |

### Why This Architecture?

1. **Single source of truth** - Changes to validation rules only need to be made in one place
2. **Frontend/Backend alignment** - Both use the same schemas from `@pokehub/shared/pokemon-types`
3. **Type safety** - `z.infer<typeof schema>` derives TypeScript types from Zod schemas
4. **No drift** - DTOs reference the base schema rather than duplicating it

---

## Files to Create/Modify

### 1. Backend Database Package (NEW)

```
packages/backend/pokehub-teams-db/
├── src/
│   ├── lib/
│   │   ├── schema/
│   │   │   └── team.schema.ts
│   │   ├── teams-db.service.ts
│   │   └── teams-db.module.ts
│   └── index.ts
├── project.json
├── tsconfig.json
└── tsconfig.lib.json
```

### 2. DTOs (Add to pokemon-types)

- `packages/shared/pokemon-types/src/lib/dtos/create-team.dto.ts`
- `packages/shared/pokemon-types/src/lib/dtos/update-team.dto.ts`
- `packages/shared/pokemon-types/src/lib/dtos/team-response.dto.ts`
- Update `packages/shared/pokemon-types/src/index.ts`

### 3. API Layer (NEW)

```
apps/pokehub-api/src/teams/
├── pipes/
│   └── showdown-team-validation.pipe.ts
├── teams.module.ts
├── teams.service.interface.ts
├── teams.service.ts
├── teams.service.provider.ts
├── teams.controller.ts
└── index.ts
```

### 4. App Registration

- `apps/pokehub-api/src/app/app.module.ts`
- `apps/pokehub-api/src/app/app.routes.ts`

### 5. Documentation

- `docs/features/team-persistence.md`

---

## Implementation Steps

### Step 1: Generate Database Package

```bash
nx g @nx/nest:library pokehub-teams-db \
  --directory=packages/backend \
  --importPath=@pokehub/backend/pokehub-teams-db
```

### Step 2: Create Database Schema

**`team.schema.ts`**:

```typescript
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

### Step 3: Create DTOs in pokemon-types

**`create-team.dto.ts`**:

```typescript
import { pokemonInTeamSchema } from '../pokemon-team.validation';
import { z } from 'zod';

export const CreateTeamDTOSchema = z.object({
  name: z.string().min(1).max(100),
  generation: z.number().int().min(1).max(9),
  format: z.string().min(1).max(50),
  pokemon: z.array(pokemonInTeamSchema).min(1).max(6),
});

export type CreateTeamDTO = z.infer<typeof CreateTeamDTOSchema>;
```

**`update-team.dto.ts`**:

```typescript
import { CreateTeamDTOSchema } from './create-team.dto';
import { z } from 'zod';

// Full replacement semantics - require complete team data on update
export const UpdateTeamDTOSchema = CreateTeamDTOSchema;
export type UpdateTeamDTO = z.infer<typeof UpdateTeamDTOSchema>;
```

**`team-response.dto.ts`**:

```typescript
import { CreateTeamDTOSchema } from './create-team.dto';
import { z } from 'zod';

export const TeamResponseDTOSchema = CreateTeamDTOSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TeamResponseDTO = z.infer<typeof TeamResponseDTOSchema>;
```

### Step 4: Implement API Layer

Follow UsersModule patterns:

**`teams.service.interface.ts`**:

```typescript
export const TEAMS_SERVICE = 'TEAMS_SERVICE';

export interface ITeamsService {
  createTeam(userId: string, data: CreateTeamDTO): Promise<TeamResponseDTO>;
  getUserTeams(userId: string): Promise<TeamResponseDTO[]>;
  getTeamById(teamId: string, userId: string): Promise<TeamResponseDTO>;
  updateTeam(
    teamId: string,
    userId: string,
    data: UpdateTeamDTO
  ): Promise<TeamResponseDTO>;
  deleteTeam(teamId: string, userId: string): Promise<void>;
}
```

**`teams.controller.ts`**:

```typescript
@Controller()
export class TeamsController {
  @Post()
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async createTeam(
    @User() user: UserJwtData,
    @Body(new ZodValidationPipe(CreateTeamDTOSchema)) data: CreateTeamDTO,
  ): Promise<TeamResponseDTO> { ... }

  @Get()
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async getUserTeams(@User() user: UserJwtData): Promise<TeamResponseDTO[]> { ... }

  @Get(':id')
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async getTeamById(
    @User() user: UserJwtData,
    @Param('id') teamId: string,
  ): Promise<TeamResponseDTO> { ... }

  @Put(':id')
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async updateTeam(
    @User() user: UserJwtData,
    @Param('id') teamId: string,
    @Body(new ZodValidationPipe(UpdateTeamDTOSchema)) data: UpdateTeamDTO,
  ): Promise<TeamResponseDTO> { ... }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async deleteTeam(
    @User() user: UserJwtData,
    @Param('id') teamId: string,
  ): Promise<void> { ... }
}
```

**`teams.module.ts`**:

```typescript
@Module({
  imports: [CommonModule, SharedAuthUtilsModule, TeamsDBModule],
  controllers: [TeamsController],
  providers: [TeamsServiceProvider],
  exports: [TEAMS_SERVICE],
})
export class TeamsModule {}
```

### Step 5: Register in App

**`app.routes.ts`** - Add:

```typescript
{ path: '/teams', module: TeamsModule },
```

**`app.module.ts`** - Add `TeamsModule` to imports

### Step 6: Database Migration

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

### Step 7: Update Documentation

Update `docs/features/team-persistence.md`

---

## API Endpoints

| Method | Endpoint     | Description          |
| ------ | ------------ | -------------------- |
| POST   | `/teams`     | Create new team      |
| GET    | `/teams`     | Get all user's teams |
| GET    | `/teams/:id` | Get specific team    |
| PUT    | `/teams/:id` | Update team          |
| DELETE | `/teams/:id` | Delete team          |

All endpoints require `Authorization: Bearer <ACCESS_TOKEN>`

---

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
│  │    (types, Zod schemas)                              │    │
│  │  - @pokehub/shared/pokemon-showdown-validation       │    │
│  │    (validateTeamForFormat using @pkmn/sim)           │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                            ↕
                      PostgreSQL
                 (teams table with JSONB)
```

---

## Key Design Decisions

### 1. PostgreSQL + JSONB (not MongoDB)

**Rationale:**

- **Document-centric access**: Teams are always loaded/saved as complete units
- **Simple queries**: 95% of operations are "get team by ID" or "list user's teams"
- **Matches frontend structure**: No impedance mismatch between API and UI
- **Performance**: Faster for our access patterns (single SELECT vs multiple JOINs)

**Performance Expectations:**

| Operation     | Expected Latency |
| ------------- | ---------------- |
| Load 1 team   | < 1ms            |
| Load 10 teams | < 5ms            |
| Save team     | < 2ms            |
| Update team   | < 2ms            |

### 2. Types in pokemon-types Package

- Reuse existing `PokemonInTeam`, `PokemonTeam` from `@pokehub/shared/pokemon-types`
- DTOs added alongside types for cohesion
- Single source of truth for both frontend and backend

### 3. Single `format` Field

- Showdown format ID (e.g., `'ou'`, `'vgc2024rege'`) - no separate tier field
- Full Showdown format ID computed as `gen${generation}${format}`
- Already correct in existing types

### 4. Validation Architecture

**Two-Layer Pipe Approach:**

1. **Structural Validation Pipe:** `ZodValidationPipe` (reusable, in `common/pipes/`)

   - Basic type checking, ranges, required fields
   - No `.refine()` to keep `.partial()` working for updates
   - Runs first to ensure valid structure

2. **Showdown Validation Pipe:** `ShowdownTeamValidationPipe` (teams-specific, in `teams/pipes/`)
   - Uses `@pokehub/shared/pokemon-showdown-validation` package
   - Calls `validateTeamForFormat()` which uses `@pkmn/sim`'s `TeamValidator`
   - Validates species, moves, abilities, items against format rules
   - Checks team composition rules (clauses, bans, restrictions)

**Request Flow:**

```
Request Body → ZodValidationPipe → ShowdownTeamValidationPipe → Controller
```

**Usage in Controller:**

```typescript
@Post()
@UsePipes(new ZodValidationPipe(CreateTeamDTOSchema), ShowdownTeamValidationPipe)
async createTeam(@Body() data: CreateTeamDTO) { ... }
```

### 5. Database Type Safety

- Using `NodePgDatabase<typeof schema>` (not `PostgresJsDatabase`) to match `node-postgres` driver
- `import * as schema` pattern for full Drizzle type support
- Foreign key to `usersTable` with CASCADE delete

### 6. Interface-First Services

- Following existing UsersService pattern
- Service token constants (`TEAMS_SERVICE`, `TEAMS_DB_SERVICE`)
- Provider pattern for DI configuration

---

## Database Schema Details

### Indexes

1. **`idx_teams_user_id`** - Fast user lookups
2. **`idx_teams_created_at`** - Sorting by date
3. **`idx_teams_user_list`** - Composite index `(userId, createdAt DESC)` for list queries

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
  evs: { hp; atk; def; spa; spd; spe };
  ivs: { hp; atk; def; spa; spd; spe };
};
```

---

## Frontend Integration ✅

- [x] Create API client functions for teams endpoints (`teams-api.ts`)
- [x] Create TanStack Query hooks (`useCreateTeam`, `useUpdateTeam`, `useDeleteTeam`, `useSaveTeam`)
- [x] Connect Team Builder Save button to `useSaveTeam` hook
- [x] Add team loading UI (server-side fetch in RSC)
- [x] Extended `PokemonTeam` type with optional `id`, `createdAt`, `updatedAt` fields

### Frontend Files

| File | Purpose |
|------|---------|
| `pokehub-team-builder/src/lib/api/teams-api.ts` | API client functions with `withAuthRetry` support |
| `pokehub-team-builder/src/lib/hooks/useTeams.ts` | TanStack Query mutation hooks |
| `pokehub-team-builder/src/server.ts` | Server exports (`getUserTeams`, `getTeamById`) for RSC |

### Auth Pattern

Hooks use `useAuthSession()` internally to get access token and `withAuthRetry()` for automatic token refresh on 401:

```typescript
const { data: session } = useAuthSession();
const response = await withAuthRetry(accessToken, (token) =>
  createTeamRequest(token, data)
);
```

## Future Enhancements

- **Testing** - Unit tests, integration tests, E2E tests
- **Team Sharing** - Add `isPublic` boolean for public team browsing
- **Import/Export** - Pokemon Showdown format import/export
