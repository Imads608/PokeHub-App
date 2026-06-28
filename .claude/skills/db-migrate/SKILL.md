---
name: db-migrate
description: Generate, push, or run Drizzle ORM migrations for PokeHub's PostgreSQL database using the project's tsx + tsconfig.base.json invocation. Use when the user changes a Drizzle schema or asks to create/apply a database migration.
---

# Drizzle migrations (PokeHub)

PokeHub uses Drizzle ORM over PostgreSQL. **Always invoke drizzle-kit through `tsx` with
`--tsconfig tsconfig.base.json`** — never `npx drizzle-kit` directly.

## Why this exact invocation

drizzle-kit does not resolve the workspace TypeScript path aliases (e.g.
`@pokehub/backend/pokehub-users-db`) on its own. Running it under `tsx` with the base tsconfig
makes alias-imported schemas resolve correctly. `bin.cjs` is drizzle-kit's CLI entry point.

## Commands

Config file: `drizzle.config.pg.ts`.

**Generate a migration** (after editing a schema):
```bash
npx tsx --tsconfig tsconfig.base.json node_modules/drizzle-kit/bin.cjs generate --config=drizzle.config.pg.ts
```

**Push schema directly** (dev/prototyping — skips migration files):
```bash
npx tsx --tsconfig tsconfig.base.json node_modules/drizzle-kit/bin.cjs push --config=drizzle.config.pg.ts
```

**Apply migrations** (what production `deploy.yml` runs before deploying the API):
```bash
npx tsx --tsconfig tsconfig.base.json node_modules/drizzle-kit/bin.cjs migrate --config=drizzle.config.pg.ts
```

## Workflow when changing a schema

1. Edit the Drizzle schema in its backend package (e.g. `packages/backend/pokehub-*-db`).
2. Run **generate** to produce a new SQL migration; review the generated file — don't blindly trust it.
3. Apply it (`push` for local dev, or `migrate` against a real DB) and verify.
4. Commit the generated migration files alongside the schema change.

## Notes
- A `DATABASE_URL`-style connection env var must be set for `push`/`migrate` (see `docs/deployment/`).
- Production migrations run automatically in the **deploy** workflow before the API container is
  updated, so generated migration files must be committed for a release to pick them up.
