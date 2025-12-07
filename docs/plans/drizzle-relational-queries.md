# Drizzle Relational Queries Setup

## Overview

This document describes how to enable Drizzle's relational queries API (`db.query.*`) in the PokeHub backend. Currently, only the query builder API (`db.select().from()`) is available.

## Current State

```typescript
// postgres.service.ts
const db = drizzle(pool);  // No schema - relational API unavailable
```

- ✅ Query builder works: `db.select().from(teams).where(...)`
- ❌ Relational API unavailable: `db.query.teams.findMany({ with: { user: true } })`

## Why Enable Relational Queries?

The relational API provides Prisma-like syntax for fetching nested data:

```typescript
// Instead of manual joins:
const result = await db
  .select()
  .from(teams)
  .leftJoin(usersTable, eq(teams.userId, usersTable.id));

// You can write:
const result = await db.query.teams.findMany({
  with: {
    user: true,  // Automatically resolves relation
  },
});
```

---

## Foreign Keys vs Relations

### Foreign Key Constraint (`.references()`)

```typescript
userId: uuid('user_id')
  .notNull()
  .references(() => usersTable.id, { onDelete: 'cascade' })
```

This is a **database-level** foreign key constraint. It tells PostgreSQL:
- This column must contain a valid `users.id`
- When the user is deleted, cascade delete their teams

It's enforced by the database, not Drizzle.

### Drizzle Relations (`relations()`)

```typescript
export const teamsRelations = relations(teams, ({ one }) => ({
  user: one(usersTable, {
    fields: [teams.userId],
    references: [usersTable.id],
  }),
}));
```

This tells **Drizzle's query builder** how to join tables. It's application-level metadata that enables:

```typescript
db.query.teams.findMany({
  with: { user: true },  // Drizzle knows how to join
});
```

### Comparison

| Feature              | `.references()`       | `relations()`          |
|----------------------|-----------------------|------------------------|
| Where                | Database (PostgreSQL) | Application (Drizzle)  |
| Purpose              | Data integrity        | Query building         |
| Enforces FK          | ✅                    | ❌                     |
| Enables `with: {}`   | ❌                    | ✅                     |
| Required for joins   | ❌                    | Only for relational API |

You need both if you want FK constraints AND the relational query API.

---

## Implementation Steps

### Step 1: Update Postgres Module to Accept Schema

**`packages/backend/pokehub-postgres/src/lib/postgres.service.ts`**:

```typescript
import type { PostgresDBConfiguration } from './models/config.model';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const POSTGRES_SERVICE = 'POSTGRES_SERVICE';

export const createPostgresProvider = (schema: Record<string, unknown>) => ({
  provide: POSTGRES_SERVICE,
  useFactory: async (
    logger: AppLogger,
    configService: ConfigService<PostgresDBConfiguration, true>
  ) => {
    const dbCreds = configService.get('db', { infer: true });
    const isProd = process.env.NODE_ENV === 'production';

    const connectionString = `postgresql://${dbCreds.user}:${dbCreds.password}@${dbCreds.host}:${dbCreds.port}/${dbCreds.name}`;

    const pool = new Pool({
      connectionString,
      ssl: isProd ? { rejectUnauthorized: false } : false,
    });

    // Pass schema to enable relational queries
    const db = drizzle(pool, { schema });
    await db.execute(sql`SELECT 1 as connected`);
    logger.log(`Successfully connected to DB: ${dbCreds.host} (SSL: ${isProd})`);
    return db;
  },
  inject: [AppLogger, ConfigService],
});

// Keep for backwards compatibility
export const postgresProvider = createPostgresProvider({});

export type PostgresService = Awaited<
  ReturnType<typeof postgresProvider.useFactory>
>;
```

**`packages/backend/pokehub-postgres/src/lib/postgres.module.ts`**:

```typescript
import { createPostgresProvider, POSTGRES_SERVICE } from './postgres.service';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerModule } from '@pokehub/backend/shared-logger';

@Module({})
export class PokeHubPostgresModule {
  static forRoot(schema: Record<string, unknown> = {}): DynamicModule {
    return {
      module: PokeHubPostgresModule,
      global: true,  // Makes POSTGRES_SERVICE available everywhere without re-importing
      imports: [ConfigModule, AppLoggerModule],
      providers: [createPostgresProvider(schema)],
      exports: [POSTGRES_SERVICE],
    };
  }
}
```

### Step 2: Update App Module

**`apps/pokehub-api/src/app/app.module.ts`**:

```typescript
// Import all table schemas
import { teams } from '@pokehub/backend/pokehub-teams-db';
import { usersTable } from '@pokehub/backend/pokehub-users-db';

// Combine into single schema object (tables only - no relations yet)
const dbSchema = {
  teams,
  usersTable,
};

@Module({
  imports: [
    PokeHubPostgresModule.forRoot(dbSchema),
    // ... other modules (no longer need to import PokeHubPostgresModule individually)
    TeamsDBModule,
    UsersDBModule,
  ],
})
export class AppModule {}
```

### Step 3: Update Entity Modules

Remove `PokeHubPostgresModule` from entity module imports since it's now global:

**`packages/backend/pokehub-teams-db/src/lib/teams-db.module.ts`**:

```typescript
@Module({
  imports: [AppLoggerModule],  // Remove PokeHubPostgresModule
  providers: [TeamsDBProvider],
  exports: [TeamsDBProvider],
})
export class TeamsDBModule {}
```

---

## What This Enables (Without Relations)

With just tables passed to `forRoot`:

```typescript
// ✅ Works - typed queries on teams table
db.query.teams.findMany({
  where: eq(teams.userId, userId),
});

// ✅ Works - typed queries
db.query.teams.findFirst({
  where: eq(teams.id, teamId),
});

// ❌ Won't work - requires relations
db.query.teams.findMany({
  with: { user: true },
});
```

---

## Adding Relations (Optional)

Only needed if you want `with: { ... }` nested fetching.

### Option A: Separate Relations Package (Recommended)

Avoids circular dependencies between entity packages.

Create `packages/backend/pokehub-db-relations/`:

```typescript
// packages/backend/pokehub-db-relations/src/lib/relations.ts
import { relations } from 'drizzle-orm';
import { teams } from '@pokehub/backend/pokehub-teams-db';
import { usersTable } from '@pokehub/backend/pokehub-users-db';

export const teamsRelations = relations(teams, ({ one }) => ({
  user: one(usersTable, {
    fields: [teams.userId],
    references: [usersTable.id],
  }),
}));

export const usersRelations = relations(usersTable, ({ many }) => ({
  teams: many(teams),
}));
```

Then in app.module.ts:

```typescript
import { teams } from '@pokehub/backend/pokehub-teams-db';
import { usersTable } from '@pokehub/backend/pokehub-users-db';
import { teamsRelations, usersRelations } from '@pokehub/backend/pokehub-db-relations';

const dbSchema = { teams, usersTable, teamsRelations, usersRelations };

@Module({
  imports: [
    PokeHubPostgresModule.forRoot(dbSchema),
  ],
})
export class AppModule {}
```

### Option B: Define Relations in App

Keep entity packages relation-free and define all relations in the app:

```typescript
// apps/pokehub-api/src/db/schema.ts
import { relations } from 'drizzle-orm';
import { teams } from '@pokehub/backend/pokehub-teams-db';
import { usersTable } from '@pokehub/backend/pokehub-users-db';

export const teamsRelations = relations(teams, ({ one }) => ({
  user: one(usersTable, {
    fields: [teams.userId],
    references: [usersTable.id],
  }),
}));

export const usersRelations = relations(usersTable, ({ many }) => ({
  teams: many(teams),
}));

export const dbSchema = { teams, usersTable, teamsRelations, usersRelations };
```

---

## Typed Database in Services

For proper typing in services, you can create a typed helper:

**`packages/backend/pokehub-postgres/src/lib/types.ts`**:

```typescript
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type TypedDatabase<TSchema extends Record<string, unknown>> =
  NodePgDatabase<TSchema>;
```

Then in services:

```typescript
import type { TypedDatabase } from '@pokehub/backend/pokehub-postgres';
import type * as schema from './schema/team.schema';

@Injectable()
class TeamsDBService {
  constructor(
    @Inject(POSTGRES_SERVICE)
    private readonly db: TypedDatabase<typeof schema>
  ) {}
}
```

---

## Migration Checklist

### Minimal (Tables Only)
- [ ] Update `postgres.service.ts` with `createPostgresProvider`
- [ ] Update `postgres.module.ts` with `forRoot` method
- [ ] Update `app.module.ts` to use `forRoot({ teams, usersTable })`
- [ ] Remove `PokeHubPostgresModule` from entity module imports
- [ ] Test that existing query builder queries still work

### With Relations
- [ ] Create relations package or define in app
- [ ] Add relations to `dbSchema` in `forRoot`
- [ ] Test `with: { ... }` queries work

---

## References

- [Drizzle Relational Queries Docs](https://orm.drizzle.team/docs/rqb)
- [Drizzle Relations Docs](https://orm.drizzle.team/docs/relations)
