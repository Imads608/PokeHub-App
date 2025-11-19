# Team Persistence Feature Documentation

## Overview

**Status:** 🚧 In Progress - Phase 3 of 6

**Implementation Progress:**
- ✅ Phase 2: Shared Models Package (Complete)
- ✅ Phase 1: Database Layer (Complete)
- ⏳ Phase 3: API Layer (In Progress)
- ⬜ Phase 4: Database Migration (Pending)
- ⬜ Phase 5: Frontend Integration (Pending)
- ⬜ Phase 6: Testing (Pending)

Team Persistence provides backend storage and retrieval functionality for Pokemon teams created in the Team Builder UI. Users can save their teams, load previously created teams, and manage multiple team configurations across different formats and tiers.

**Key Technologies:**
- PostgreSQL with JSONB storage
- Drizzle ORM for type-safe database operations
- NestJS REST API with JWT authentication
- TanStack Query for frontend data synchronization
- Zod schema validation

**Decision:** PostgreSQL + JSONB (not MongoDB) for optimal performance with document-centric access patterns while maintaining relational integrity.

---

## Implementation Notes

### Completed Work

#### Phase 2: Shared Team Models ✅
**Package:** `@pokehub/shared/shared-team-models`

**Key Decisions:**
- Moved `PokemonInTeam`, `PokemonTeam`, `BattleFormat` types from frontend to shared package
- Both frontend and backend now use shared types (no duplication)
- Created DTOs: `CreateTeamDTO`, `UpdateTeamDTO`, `TeamResponseDTO`
- **Validation Strategy:** Basic structural validation only (no `.refine()` to keep `.partial()` working for updates)
  - Zod schemas validate types, ranges, required fields
  - Domain validation (tier, nature, species) handled separately in backend pipes

**Files Created:**
- `src/lib/team.types.ts` - Core team types
- `src/lib/dtos/create-team.dto.ts` - Creation DTO with Zod schema
- `src/lib/dtos/update-team.dto.ts` - Update DTO (partial)
- `src/lib/dtos/team-response.dto.ts` - API response DTO

#### Phase 1: Database Layer ✅
**Package:** `@pokehub/backend/pokehub-teams-db`

**Key Decisions:**
- Using `NodePgDatabase<typeof schema>` (not `PostgresJsDatabase`) to match `node-postgres` driver
- Created `battle_format` PostgreSQL enum for type safety
- Composite index: `(userId, generation, createdAt DESC)` for optimal filtering by generation
- Schema typing with `import * as schema` pattern for full Drizzle type support

**Schema Details:**
- Foreign key to `usersTable` with CASCADE delete
- JSONB column for `pokemon` array (typed with `PokemonInTeam[]`)
- Three indexes:
  1. `idx_teams_user_id` - Fast user lookups
  2. `idx_teams_created_at` - Sorting by date
  3. `idx_teams_user_list` - Composite covering index `(userId, generation, createdAt DESC)`

**Files Created:**
- `src/lib/schema/team.schema.ts` - Drizzle schema with enum and table
- `src/lib/teams-db.service.ts` - CRUD operations
- `src/lib/teams-db.module.ts` - NestJS module (renamed from auto-generated name)

#### Phase 3: API Layer (In Progress) ⏳

**Validation Architecture Decision:**
- **Structural Validation:** `ZodValidationPipe` (reusable, in `common/pipes/`)
- **Domain Validation:** `TeamDomainValidationPipe` (teams-specific, in `teams/pipes/`)
- Uses `@UsePipes()` decorator pattern (NestJS standard)
- Validates tier, nature, species using `@pkmn/dex`

**Files Created:**
- `src/common/pipes/zod-validation.pipe.ts` - Generic Zod validation ✅

**Remaining:**
- `src/teams/pipes/team-domain-validation.pipe.ts` - Domain validation
- `src/teams/teams.service.ts` - Business logic (no validation, just DB operations)
- `src/teams/teams.controller.ts` - REST endpoints with pipes
- `src/teams/teams.module.ts` - Module registration
- Register in `app.module.ts`

### Key Architectural Decisions

1. **Shared Types Over Duplication**
   - Types live in `@pokehub/shared/shared-team-models`
   - Frontend package re-exports from shared
   - Backend imports from shared
   - Single source of truth

2. **Database Type Safety**
   - Using `NodePgDatabase<typeof schema>` for full Drizzle typing
   - `import * as schema` pattern includes all exports automatically
   - Composite index with generation for common filter pattern

3. **Validation Layers**
   - **Shared Zod Schemas:** Basic structural validation (frontend + backend)
   - **Backend Pipes:** Domain validation with `@pkmn/dex` (backend only)
   - **Service Layer:** Pure business logic (no validation)

4. **No Refinements in Shared Schemas**
   - Keeps `.partial()` working for `UpdateTeamDTOSchema`
   - Domain validation moved to backend-only pipes
   - Frontend gets immediate feedback from shared schemas
   - Backend adds deep validation before DB operations

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Team Builder UI (pokehub-team-builder)                    │ │
│  │  - TeamEditor component                                    │ │
│  │  - Team configuration & Pokemon editing                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            ↕ TanStack Query Hooks               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Team Data Hooks                                           │ │
│  │  - useSaveTeam()    - useUpdateTeam()                      │ │
│  │  - useLoadTeams()   - useDeleteTeam()                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  ↕
                          HTTP REST API (JWT)
                                  ↕
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Layer (pokehub-api/src/teams/)                       │ │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐ │ │
│  │  │ Controller   │→ │   Service   │→ │   Validation     │ │ │
│  │  │ (REST routes)│  │ (Auth logic)│  │ (Zod schemas)    │ │ │
│  │  └──────────────┘  └─────────────┘  └──────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            ↕                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Database Layer (backend/pokehub-teams-db)                 │ │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐ │ │
│  │  │   Schema     │  │   Service   │  │   Module         │ │ │
│  │  │ (Drizzle)    │  │ (CRUD ops)  │  │ (DI config)      │ │ │
│  │  └──────────────┘  └─────────────┘  └──────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
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
│   ├── index.ts
├── project.json
├── tsconfig.json
└── tsconfig.lib.json
```

#### Shared Models
```
packages/shared/shared-team-models/
├── src/
│   ├── lib/
│   │   ├── dtos/
│   │   │   ├── create-team.dto.ts      # POST request payload
│   │   │   ├── update-team.dto.ts      # PUT request payload
│   │   │   └── team-response.dto.ts    # API response format
│   │   └── index.ts
│   ├── index.ts
├── project.json
└── tsconfig.json
```

#### API Layer
```
apps/pokehub-api/src/teams/
├── teams.controller.ts                 # REST endpoints
├── teams.service.ts                    # Business logic
└── teams.module.ts                     # Module registration
```

### Data Flow

#### Save Team Flow
```
User clicks "Save Team" in TeamEditor
  ↓
Frontend validates team with Zod schema
  ↓
useSaveTeam() hook calls POST /api/teams
  ↓
JWT authentication middleware verifies user
  ↓
TeamsController receives CreateTeamDTO
  ↓
TeamsService validates ownership & business rules
  ↓
TeamsDBService inserts into PostgreSQL
  ↓
Database stores team with JSONB pokemon array
  ↓
Response with TeamResponseDTO (includes id, timestamps)
  ↓
TanStack Query updates cache & invalidates queries
  ↓
UI updates with saved team confirmation
```

#### Load Teams Flow
```
User opens Team Builder
  ↓
useLoadTeams() hook calls GET /api/teams
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

---

## Database Design

### JSONB vs Normalized Approach

#### Decision: Use JSONB ✅

**Rationale:**
- **Document-centric access**: Teams are always loaded/saved as complete units
- **Simple queries**: 95% of operations are "get team by ID" or "list user's teams"
- **Matches frontend structure**: No impedance mismatch between API and UI
- **Performance**: Faster for our access patterns (single SELECT vs multiple JOINs)
- **Infrequent updates**: Users save occasionally, not continuously

#### Performance Comparison

##### Expected Load (10,000 users, ~10 teams each = 100,000 teams)

**JSONB Approach:**
```sql
-- Load single team (< 1ms)
SELECT * FROM teams WHERE id = $1 AND user_id = $2;

-- Load all user teams (< 5ms for 10 teams)
SELECT * FROM teams WHERE user_id = $1 ORDER BY created_at DESC;

-- Save team (< 2ms)
INSERT INTO teams (user_id, name, generation, format, tier, pokemon, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW());
```

**Normalized Approach (slower for our use case):**
```sql
-- Load single team (2-5ms - requires 3-table JOIN)
SELECT t.*, p.*, m.*
FROM teams t
LEFT JOIN pokemon_in_team p ON p.team_id = t.id
LEFT JOIN pokemon_moves m ON m.pokemon_id = p.id
WHERE t.id = $1 AND t.user_id = $2;

-- More complex queries, more code to maintain
```

**Benchmark Estimates:**
| Operation | JSONB | Normalized |
|-----------|-------|------------|
| Load 1 team | < 1ms | 2-5ms (JOINs) |
| Load 10 teams | < 5ms | 20-50ms (JOINs) |
| Save team | < 2ms | 5-10ms (multiple INSERTs) |
| Update team | < 2ms | 5-10ms (multiple UPDATEs) |

#### When to Reconsider

Switch to normalized IF you later need:
- ❌ Team sharing/forking (copy one Pokemon to another team)
- ❌ Pokemon-level analytics ("most popular Pokemon in OU")
- ❌ Partial team updates via API ("change just move slot 1")
- ❌ Real-time collaborative editing

**Conclusion:** JSONB will NOT be your bottleneck. It's the right choice.

### Teams Table Schema

```typescript
// packages/backend/pokehub-teams-db/src/lib/schema/team.schema.ts
import { pgTable, uuid, varchar, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from '@pokehub/backend/pokehub-users-db';

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    generation: integer('generation').notNull(), // 1-9
    format: varchar('format', { length: 20 }).notNull(), // 'Singles' | 'Doubles'
    tier: varchar('tier', { length: 50 }).notNull(), // 'OU', 'UU', etc.
    pokemon: jsonb('pokemon').notNull().$type<PokemonInTeam[]>(), // Array of 1-6 Pokemon
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_teams_user_id').on(table.userId),
    createdAtIdx: index('idx_teams_created_at').on(table.createdAt),
    // Covering index for team lists (index-only scan)
    userListIdx: index('idx_teams_user_list')
      .on(table.userId, table.createdAt.desc())
      .include(table.id, table.name, table.generation, table.format, table.tier),
  })
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
```

**JSONB Structure (pokemon column):**
```typescript
// Each team's pokemon column stores an array of 1-6 Pokemon
type PokemonInTeam = {
  species: string;           // 'Pikachu'
  name: string;              // Custom nickname
  ability: string;           // 'Static'
  item: string;              // 'Light Ball'
  nature: string;            // 'Jolly'
  gender: 'M' | 'F' | 'N';
  level: number;             // 1-100
  moves: string[];           // Array of 1-4 move names
  evs: {                     // Effort Values
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  ivs: {                     // Individual Values
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
};
```

### Database Constraints

- **Primary Key:** UUID for team ID (random generation)
- **Foreign Key:** userId references users.id with CASCADE delete
- **Not Null:** All fields except custom nickname
- **Indexes:**
  - `idx_teams_user_id`: Fast user team lookups
  - `idx_teams_created_at`: Sorting by creation date
  - `idx_teams_user_list`: Covering index for list queries (index-only scans)

### Optional JSONB Index (Add Later If Needed)

```sql
-- GIN index for searching within Pokemon data
-- Only add if you need queries like "find all teams with Pikachu"
CREATE INDEX idx_teams_pokemon_gin ON teams USING GIN (pokemon);

-- Enables queries like:
SELECT * FROM teams WHERE pokemon @> '[{"species": "Pikachu"}]';
```

---

## Implementation Steps

### Phase 1: Database Layer (Backend Package)

**Create:** `packages/backend/pokehub-teams-db/`

#### Step 1.1: Generate Package
```bash
nx g @nx/node:library pokehub-teams-db \
  --directory=packages/backend \
  --importPath=@pokehub/backend/pokehub-teams-db \
  --publishable=false
```

#### Step 1.2: Create Schema
**File:** `packages/backend/pokehub-teams-db/src/lib/schema/team.schema.ts`

```typescript
import { pgTable, uuid, varchar, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from '@pokehub/backend/pokehub-users-db';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    generation: integer('generation').notNull(),
    format: varchar('format', { length: 20 }).notNull(),
    tier: varchar('tier', { length: 50 }).notNull(),
    pokemon: jsonb('pokemon').notNull().$type<PokemonInTeam[]>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_teams_user_id').on(table.userId),
    createdAtIdx: index('idx_teams_created_at').on(table.createdAt),
    userListIdx: index('idx_teams_user_list')
      .on(table.userId, table.createdAt.desc())
      .include(table.id, table.name, table.generation, table.format, table.tier),
  })
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
```

#### Step 1.3: Create Database Service
**File:** `packages/backend/pokehub-teams-db/src/lib/teams-db.service.ts`

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc } from 'drizzle-orm';
import { teams, type Team, type NewTeam } from './schema/team.schema';
import * as schema from './schema/team.schema';

@Injectable()
export class TeamsDBService {
  constructor(
    @Inject('POKEHUB_DB_CONNECTION')
    private readonly db: PostgresJsDatabase<typeof schema>
  ) {}

  async createTeam(newTeam: NewTeam): Promise<Team> {
    const [team] = await this.db
      .insert(teams)
      .values({
        ...newTeam,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return team;
  }

  async getTeamById(teamId: string, userId: string): Promise<Team | null> {
    const [team] = await this.db
      .select()
      .from(teams)
      .where(and(eq(teams.id, teamId), eq(teams.userId, userId)));
    return team || null;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    return await this.db
      .select()
      .from(teams)
      .where(eq(teams.userId, userId))
      .orderBy(desc(teams.createdAt));
  }

  async updateTeam(
    teamId: string,
    userId: string,
    updates: Partial<Omit<Team, 'id' | 'userId' | 'createdAt'>>
  ): Promise<Team | null> {
    const [team] = await this.db
      .update(teams)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
      .returning();
    return team || null;
  }

  async deleteTeam(teamId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(teams)
      .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
      .returning();
    return result.length > 0;
  }
}
```

#### Step 1.4: Create Database Module
**File:** `packages/backend/pokehub-teams-db/src/lib/teams-db.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PokeHubPostgresModule } from '@pokehub/backend/pokehub-postgres';
import { TeamsDBService } from './teams-db.service';

@Module({
  imports: [PokeHubPostgresModule],
  providers: [TeamsDBService],
  exports: [TeamsDBService],
})
export class TeamsDBModule {}
```

#### Step 1.5: Export from Package
**File:** `packages/backend/pokehub-teams-db/src/index.ts`

```typescript
export * from './lib/teams-db.module';
export * from './lib/teams-db.service';
export * from './lib/schema/team.schema';
```

---

### Phase 2: Shared Models (DTOs)

**Create:** `packages/shared/shared-team-models/`

#### Step 2.1: Generate Package
```bash
nx g @nx/js:library shared-team-models \
  --directory=packages/shared \
  --importPath=@pokehub/shared/shared-team-models \
  --publishable=false
```

#### Step 2.2: Create DTOs
**File:** `packages/shared/shared-team-models/src/lib/dtos/create-team.dto.ts`

```typescript
import { z } from 'zod';
import { PokemonInTeamSchema } from '@pokehub/frontend/pokemon-types';

export const CreateTeamDTOSchema = z.object({
  name: z.string().min(1).max(100),
  generation: z.number().int().min(1).max(9),
  format: z.enum(['Singles', 'Doubles']),
  tier: z.string().min(1).max(50),
  pokemon: z.array(PokemonInTeamSchema).min(1).max(6),
});

export type CreateTeamDTO = z.infer<typeof CreateTeamDTOSchema>;
```

**File:** `packages/shared/shared-team-models/src/lib/dtos/update-team.dto.ts`

```typescript
import { z } from 'zod';
import { CreateTeamDTOSchema } from './create-team.dto';

export const UpdateTeamDTOSchema = CreateTeamDTOSchema.partial();

export type UpdateTeamDTO = z.infer<typeof UpdateTeamDTOSchema>;
```

**File:** `packages/shared/shared-team-models/src/lib/dtos/team-response.dto.ts`

```typescript
import { z } from 'zod';
import { CreateTeamDTOSchema } from './create-team.dto';

export const TeamResponseDTOSchema = CreateTeamDTOSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TeamResponseDTO = z.infer<typeof TeamResponseDTOSchema>;
```

#### Step 2.3: Export from Package
**File:** `packages/shared/shared-team-models/src/index.ts`

```typescript
export * from './lib/dtos/create-team.dto';
export * from './lib/dtos/update-team.dto';
export * from './lib/dtos/team-response.dto';
```

---

### Phase 3: API Layer

**Location:** `apps/pokehub-api/src/teams/`

#### Step 3.1: Create Teams Service
**File:** `apps/pokehub-api/src/teams/teams.service.ts`

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TeamsDBService } from '@pokehub/backend/pokehub-teams-db';
import { CreateTeamDTO, UpdateTeamDTO, TeamResponseDTO } from '@pokehub/shared/shared-team-models';
import { LoggerService } from '@pokehub/backend/shared-logger';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamsDBService: TeamsDBService,
    private readonly logger: LoggerService
  ) {
    this.logger.setContext(TeamsService.name);
  }

  async createTeam(userId: string, createTeamDto: CreateTeamDTO): Promise<TeamResponseDTO> {
    this.logger.log(`Creating team for user ${userId}: ${createTeamDto.name}`);

    const team = await this.teamsDBService.createTeam({
      userId,
      ...createTeamDto,
    });

    return this.mapToResponseDTO(team);
  }

  async getUserTeams(userId: string): Promise<TeamResponseDTO[]> {
    this.logger.log(`Fetching teams for user ${userId}`);

    const teams = await this.teamsDBService.getUserTeams(userId);
    return teams.map(this.mapToResponseDTO);
  }

  async getTeamById(teamId: string, userId: string): Promise<TeamResponseDTO> {
    const team = await this.teamsDBService.getTeamById(teamId, userId);

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    return this.mapToResponseDTO(team);
  }

  async updateTeam(
    teamId: string,
    userId: string,
    updateTeamDto: UpdateTeamDTO
  ): Promise<TeamResponseDTO> {
    this.logger.log(`Updating team ${teamId} for user ${userId}`);

    const team = await this.teamsDBService.updateTeam(teamId, userId, updateTeamDto);

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    return this.mapToResponseDTO(team);
  }

  async deleteTeam(teamId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting team ${teamId} for user ${userId}`);

    const deleted = await this.teamsDBService.deleteTeam(teamId, userId);

    if (!deleted) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }
  }

  private mapToResponseDTO(team: any): TeamResponseDTO {
    return {
      id: team.id,
      userId: team.userId,
      name: team.name,
      generation: team.generation,
      format: team.format,
      tier: team.tier,
      pokemon: team.pokemon,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }
}
```

#### Step 3.2: Create Teams Controller
**File:** `apps/pokehub-api/src/teams/teams.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TokenAuth, User } from '@pokehub/backend/shared-auth-utils';
import { CreateTeamDTO, UpdateTeamDTO, TeamResponseDTO } from '@pokehub/shared/shared-team-models';
import type { UserTokenPayload } from '@pokehub/shared/shared-auth-models';

@Controller('teams')
@TokenAuth('ACCESS_TOKEN')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTeam(
    @User() user: UserTokenPayload,
    @Body() createTeamDto: CreateTeamDTO
  ): Promise<TeamResponseDTO> {
    return this.teamsService.createTeam(user.id, createTeamDto);
  }

  @Get()
  async getUserTeams(@User() user: UserTokenPayload): Promise<TeamResponseDTO[]> {
    return this.teamsService.getUserTeams(user.id);
  }

  @Get(':id')
  async getTeamById(
    @User() user: UserTokenPayload,
    @Param('id') teamId: string
  ): Promise<TeamResponseDTO> {
    return this.teamsService.getTeamById(teamId, user.id);
  }

  @Put(':id')
  async updateTeam(
    @User() user: UserTokenPayload,
    @Param('id') teamId: string,
    @Body() updateTeamDto: UpdateTeamDTO
  ): Promise<TeamResponseDTO> {
    return this.teamsService.updateTeam(teamId, user.id, updateTeamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTeam(@User() user: UserTokenPayload, @Param('id') teamId: string): Promise<void> {
    return this.teamsService.deleteTeam(teamId, user.id);
  }
}
```

#### Step 3.3: Create Teams Module
**File:** `apps/pokehub-api/src/teams/teams.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TeamsDBModule } from '@pokehub/backend/pokehub-teams-db';
import { LoggerModule } from '@pokehub/backend/shared-logger';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [TeamsDBModule, LoggerModule],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
```

#### Step 3.4: Register in AppModule
**File:** `apps/pokehub-api/src/app/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TeamsModule } from '../teams/teams.module'; // ADD THIS
import configuration from '../config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
    UsersModule,
    TeamsModule, // ADD THIS
  ],
})
export class AppModule {}
```

---

### Phase 4: Database Migration

#### Step 4.1: Update Drizzle Config
**File:** `drizzle.config.pg.ts` (if teams schema needs to be added to config)

Ensure the teams schema is exported from the main schema file that Drizzle reads.

#### Step 4.2: Generate Migration
```bash
npx drizzle-kit generate
```

This will generate a migration file in the migrations directory.

#### Step 4.3: Review Generated SQL
Check the generated migration file to ensure:
- Table creation is correct
- Indexes are created
- Foreign key constraints are proper
- CASCADE delete is configured

Expected SQL:
```sql
CREATE TABLE "teams" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL,
  "generation" INTEGER NOT NULL,
  "format" VARCHAR(20) NOT NULL,
  "tier" VARCHAR(50) NOT NULL,
  "pokemon" JSONB NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_teams_user_id" ON "teams"("user_id");
CREATE INDEX "idx_teams_created_at" ON "teams"("created_at");
CREATE INDEX "idx_teams_user_list" ON "teams"("user_id", "created_at" DESC) INCLUDE ("id", "name", "generation", "format", "tier");
```

#### Step 4.4: Apply Migration
```bash
npx drizzle-kit push
```

Verify the migration succeeded by checking the database:
```bash
psql -d pokehub -c "\d teams"
```

---

### Phase 5: Frontend Integration

**Location:** `packages/frontend/pokehub-team-builder/`

#### Step 5.1: Create API Client
**File:** `packages/frontend/pokehub-team-builder/src/lib/api/teams-api.ts`

```typescript
import { api } from '@pokehub/frontend/shared-data-provider';
import type { CreateTeamDTO, UpdateTeamDTO, TeamResponseDTO } from '@pokehub/shared/shared-team-models';

export const teamsApi = {
  createTeam: async (team: CreateTeamDTO): Promise<TeamResponseDTO> => {
    const response = await api.post('/teams', team);
    return response.data;
  },

  getUserTeams: async (): Promise<TeamResponseDTO[]> => {
    const response = await api.get('/teams');
    return response.data;
  },

  getTeamById: async (teamId: string): Promise<TeamResponseDTO> => {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  },

  updateTeam: async (teamId: string, updates: UpdateTeamDTO): Promise<TeamResponseDTO> => {
    const response = await api.put(`/teams/${teamId}`, updates);
    return response.data;
  },

  deleteTeam: async (teamId: string): Promise<void> => {
    await api.delete(`/teams/${teamId}`);
  },
};
```

#### Step 5.2: Create TanStack Query Hooks
**File:** `packages/frontend/pokehub-team-builder/src/lib/hooks/useTeamPersistence.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '../api/teams-api';
import type { CreateTeamDTO, UpdateTeamDTO, TeamResponseDTO } from '@pokehub/shared/shared-team-models';

const TEAMS_QUERY_KEY = ['teams'];

export const useUserTeams = () => {
  return useQuery({
    queryKey: TEAMS_QUERY_KEY,
    queryFn: teamsApi.getUserTeams,
  });
};

export const useTeamById = (teamId: string | null) => {
  return useQuery({
    queryKey: [...TEAMS_QUERY_KEY, teamId],
    queryFn: () => teamsApi.getTeamById(teamId!),
    enabled: !!teamId,
  });
};

export const useSaveTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (team: CreateTeamDTO) => teamsApi.createTeam(team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, updates }: { teamId: string; updates: UpdateTeamDTO }) =>
      teamsApi.updateTeam(teamId, updates),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...TEAMS_QUERY_KEY, teamId] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => teamsApi.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
    },
  });
};
```

#### Step 5.3: Update TeamEditor Component
**File:** `packages/frontend/pokehub-team-builder/src/lib/team-editor/team-editor.tsx`

Add team loading/saving functionality:

```typescript
import { useSaveTeam, useUpdateTeam, useUserTeams } from '../hooks/useTeamPersistence';
import { useTeamEditorContext } from '../context/team-editor.context';

export function TeamEditor() {
  const { teamName, generation, format, tier, teamPokemon } = useTeamEditorContext();
  const { data: userTeams, isLoading } = useUserTeams();
  const saveTeamMutation = useSaveTeam();
  const updateTeamMutation = useUpdateTeam();

  const handleSaveTeam = async () => {
    const teamData = {
      name: teamName.value,
      generation: generation.value,
      format: format.value,
      tier: tier.value,
      pokemon: teamPokemon.value.filter(Boolean), // Remove undefined slots
    };

    try {
      await saveTeamMutation.mutateAsync(teamData);
      // Show success toast
    } catch (error) {
      // Show error toast
    }
  };

  // Render team list, save button, etc.
}
```

#### Step 5.4: Add Team Selection UI
Create a team selector component that allows users to:
- View their saved teams
- Load a team into the editor
- Create new team
- Delete teams

---

### Phase 6: Testing

#### Backend Unit Tests
**File:** `packages/backend/pokehub-teams-db/src/lib/teams-db.service.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { TeamsDBService } from './teams-db.service';

describe('TeamsDBService', () => {
  let service: TeamsDBService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TeamsDBService,
        {
          provide: 'POKEHUB_DB_CONNECTION',
          useValue: mockDrizzleDb,
        },
      ],
    }).compile();

    service = module.get(TeamsDBService);
  });

  describe('createTeam', () => {
    it('should create a team', async () => {
      // Test implementation
    });
  });

  describe('getUserTeams', () => {
    it('should return user teams', async () => {
      // Test implementation
    });
  });

  // More tests...
});
```

#### API Integration Tests
**File:** `apps/pokehub-api/src/teams/teams.controller.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

describe('TeamsController', () => {
  let controller: TeamsController;
  let service: TeamsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: {
            createTeam: jest.fn(),
            getUserTeams: jest.fn(),
            // Mock other methods
          },
        },
      ],
    }).compile();

    controller = module.get(TeamsController);
    service = module.get(TeamsService);
  });

  describe('POST /teams', () => {
    it('should create a team', async () => {
      // Test implementation
    });

    it('should return 401 without authentication', async () => {
      // Test implementation
    });
  });

  // More tests...
});
```

#### Frontend Hook Tests
**File:** `packages/frontend/pokehub-team-builder/src/lib/hooks/useTeamPersistence.spec.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSaveTeam, useUserTeams } from './useTeamPersistence';

describe('useTeamPersistence', () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useSaveTeam', () => {
    it('should save team and invalidate queries', async () => {
      // Test implementation
    });
  });

  // More tests...
});
```

#### E2E Tests
**File:** `apps/pokehub-app-e2e/src/team-builder.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Team Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to team builder
  });

  test('should save a team', async ({ page }) => {
    // Fill out team
    // Click save
    // Verify success message
    // Reload page
    // Verify team is loaded
  });

  test('should load existing team', async ({ page }) => {
    // Navigate to team builder
    // Select team from list
    // Verify team data is loaded into editor
  });

  test('should update existing team', async ({ page }) => {
    // Load team
    // Modify Pokemon
    // Save changes
    // Verify update succeeded
  });

  test('should delete team', async ({ page }) => {
    // Load team
    // Click delete
    // Confirm deletion
    // Verify team is removed from list
  });
});
```

---

## API Endpoint Specifications

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

---

### POST /teams

**Description:** Create a new team for the authenticated user.

**Request:**
```typescript
POST /teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My OU Team",
  "generation": 9,
  "format": "Singles",
  "tier": "OU",
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
    },
    // ... up to 5 more Pokemon
  ]
}
```

**Response:**
```typescript
201 Created

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "My OU Team",
  "generation": 9,
  "format": "Singles",
  "tier": "OU",
  "pokemon": [ /* ... */ ],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Validation Errors:**
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

**Description:** Get all teams for the authenticated user, ordered by creation date (newest first).

**Request:**
```typescript
GET /teams
Authorization: Bearer <token>
```

**Response:**
```typescript
200 OK

[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "My OU Team",
    "generation": 9,
    "format": "Singles",
    "tier": "OU",
    "pokemon": [ /* ... */ ],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "VGC Doubles Team",
    "generation": 9,
    "format": "Doubles",
    "tier": "VGC2024 Reg F",
    "pokemon": [ /* ... */ ],
    "createdAt": "2025-01-14T15:20:00.000Z",
    "updatedAt": "2025-01-14T15:20:00.000Z"
  }
]
```

---

### GET /teams/:id

**Description:** Get a specific team by ID. User can only access their own teams.

**Request:**
```typescript
GET /teams/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response:**
```typescript
200 OK

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "My OU Team",
  "generation": 9,
  "format": "Singles",
  "tier": "OU",
  "pokemon": [ /* ... */ ],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Errors:**
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

**Description:** Update an existing team. All fields are optional (partial update).

**Request:**
```typescript
PUT /teams/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Team Name",
  "pokemon": [ /* updated Pokemon array */ ]
}
```

**Response:**
```typescript
200 OK

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "Updated Team Name",
  "generation": 9,
  "format": "Singles",
  "tier": "OU",
  "pokemon": [ /* ... */ ],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T11:45:00.000Z"
}
```

**Errors:**
```typescript
404 Not Found

{
  "statusCode": 404,
  "message": "Team with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

---

### DELETE /teams/:id

**Description:** Delete a team. User can only delete their own teams.

**Request:**
```typescript
DELETE /teams/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response:**
```typescript
204 No Content
```

**Errors:**
```typescript
404 Not Found

{
  "statusCode": 404,
  "message": "Team with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

---

## Validation

### Backend Validation

**Zod Schema Validation:**
```typescript
// Applied to all incoming DTOs
CreateTeamDTOSchema.parse(body); // Throws ValidationError if invalid
```

**Business Rules:**
1. User can only access their own teams (enforced by service layer)
2. Team name: 1-100 characters
3. Generation: 1-9
4. Format: 'Singles' or 'Doubles'
5. Pokemon array: 1-6 Pokemon
6. Each Pokemon must have valid species, moves, EVs, IVs

**Authorization:**
- All endpoints require valid ACCESS_TOKEN
- User ID extracted from JWT payload
- All queries filtered by userId

### Frontend Validation

**Pre-save Checks:**
```typescript
import { validateTeam } from '@pokehub/frontend/pokemon-types';

const validation = validateTeam(teamData);
if (!validation.isValid) {
  // Show validation errors
  return;
}

// Proceed with save
await saveTeamMutation.mutateAsync(teamData);
```

**Error Handling:**
```typescript
try {
  await saveTeamMutation.mutateAsync(teamData);
  toast.success('Team saved successfully!');
} catch (error) {
  if (error.response?.status === 400) {
    toast.error('Invalid team data. Please check all fields.');
  } else if (error.response?.status === 401) {
    toast.error('You must be logged in to save teams.');
  } else {
    toast.error('Failed to save team. Please try again.');
  }
}
```

---

## Testing Strategy

### Unit Tests (Target: 80% coverage)

**Database Layer:**
- ✅ TeamsDBService CRUD operations
- ✅ Schema validation
- ✅ Error handling

**API Layer:**
- ✅ TeamsService business logic
- ✅ Authorization checks
- ✅ Error responses

**Frontend Hooks:**
- ✅ TanStack Query mutations
- ✅ Cache invalidation
- ✅ Optimistic updates

### Integration Tests

**API Endpoints:**
- ✅ POST /teams creates team in database
- ✅ GET /teams returns only user's teams
- ✅ PUT /teams updates team correctly
- ✅ DELETE /teams removes team
- ✅ 401 responses without authentication
- ✅ 404 responses for non-existent teams

### E2E Tests

**Critical User Flows:**
- ✅ Create team → Save → Reload page → Team persists
- ✅ Load existing team → Edit → Save → Changes persist
- ✅ Delete team → Team removed from list
- ✅ Multiple teams → Switch between teams → Correct data loaded

---

## File Locations

### Backend Files
```
packages/backend/pokehub-teams-db/
├── src/
│   ├── lib/
│   │   ├── schema/team.schema.ts
│   │   ├── teams-db.service.ts
│   │   ├── teams-db.module.ts
│   │   └── teams-db.service.spec.ts
│   └── index.ts

packages/shared/shared-team-models/
├── src/
│   ├── lib/dtos/
│   │   ├── create-team.dto.ts
│   │   ├── update-team.dto.ts
│   │   └── team-response.dto.ts
│   └── index.ts

apps/pokehub-api/src/teams/
├── teams.controller.ts
├── teams.service.ts
├── teams.module.ts
├── teams.controller.spec.ts
└── teams.service.spec.ts
```

### Frontend Files
```
packages/frontend/pokehub-team-builder/
├── src/lib/
│   ├── api/
│   │   └── teams-api.ts
│   ├── hooks/
│   │   ├── useTeamPersistence.ts
│   │   └── useTeamPersistence.spec.ts
│   └── team-editor/
│       └── team-editor.tsx (updated)
```

### Database Files
```
migrations/
└── XXXX_create_teams_table.sql (generated by Drizzle)
```

---

## Dependencies

### New Dependencies (None - all existing)
All required packages are already installed:
- ✅ `drizzle-orm`
- ✅ `postgres`
- ✅ `@nestjs/common`
- ✅ `@tanstack/react-query`
- ✅ `zod`

### Existing Packages to Use
- `@pokehub/backend/pokehub-postgres` - Database connection
- `@pokehub/backend/pokehub-users-db` - User schema for FK
- `@pokehub/backend/shared-auth-utils` - JWT guards and decorators
- `@pokehub/backend/shared-logger` - Logging
- `@pokehub/frontend/pokemon-types` - PokemonInTeam type
- `@pokehub/frontend/shared-data-provider` - API client
- `@pokehub/shared/shared-auth-models` - UserTokenPayload type

---

## Future Enhancements

### Phase 7: Team Sharing (Future)
- Add `isPublic` boolean to teams table
- Create public team browsing endpoint
- Team forking/importing functionality

### Phase 8: Team Analytics (Future)
- Most popular Pokemon per tier
- Move usage statistics
- Team composition analysis

### Phase 9: Team Builder Improvements (Future)
- Autosave functionality
- Team version history
- Collaborative team editing

### Phase 10: Import/Export (Future)
- Pokemon Showdown format import/export
- QR code team sharing
- Team image generation

---

## Changelog

### 2025-01-17
- **Created:** Initial documentation
- **Decision:** PostgreSQL + JSONB over MongoDB
- **Designed:** 6-phase implementation plan
- **Documented:** Complete API specifications and data flows

---

## Notes

**Performance Expectations:**
- Load single team: < 1ms
- Load 10 teams: < 5ms
- Save team: < 2ms

**Scalability:**
- Current design handles 100,000+ teams easily
- JSONB performance is excellent for expected load
- Indexes ensure fast queries at scale

**Migration Path:**
- Can migrate to normalized schema later if needed
- JSONB provides flexibility without commitment
- No data loss risk during implementation
