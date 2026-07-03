# Database Setup Guide

PokeHub uses **PostgreSQL** in every environment, accessed through Drizzle ORM. This document is
the source of truth for how the database is provisioned and connected.

- **Local development:** a throwaway PostgreSQL container.
- **Production:** **Azure Database for PostgreSQL — Flexible Server** (migrated off Supabase in
  July 2026 after the free-tier Supabase project was auto-deleted following 90 days of inactivity).

> Migrations are always applied with the project's `tsx --tsconfig tsconfig.base.json` invocation —
> never `npx drizzle-kit` directly. See the [`db-migrate`](../../.agents/skills/db-migrate/SKILL.md)
> skill for why and the exact commands.

## Production database (Azure Database for PostgreSQL)

| Property | Value |
| --- | --- |
| Provider | Azure Database for PostgreSQL — Flexible Server |
| Server | `pokehub-pg-d65dd1.postgres.database.azure.com` |
| Resource group | `pokehub_group` |
| Region | Central US (East US / East US 2 were region-restricted on this subscription) |
| Tier / SKU | Burstable `Standard_B1ms` (1 vCPU, 2 GB), 32 GB storage, PostgreSQL 16 |
| Database | `pokehub` |
| Admin user | `pokehubadmin` |
| Port | `5432` |
| SSL | **Required** (`DB_SSL=true`; the API connects with `rejectUnauthorized: false`) |

The runtime connection is built in
`packages/backend/pokehub-postgres/src/lib/postgres.service.ts`, which enables SSL whenever
`NODE_ENV=production`.

### Firewall

Flexible Server denies all traffic by default. Two allowances are configured:

- **Allow Azure services** — a firewall rule `0.0.0.0`–`0.0.0.0`, which for Azure Database for
  PostgreSQL means "allow other Azure resources" (this is how the Container App connects). Note this
  semantic is **not** the same as Azure Cache for Redis — see the
  [Redis firewall gotcha](./container-apps/troubleshooting.md#issue-redis-connection-fails-fast).
- **Per-IP rules** for any machine that needs to run migrations locally (e.g. your dev box).

Add a dev IP:

```bash
MYIP=$(curl -s https://api.ipify.org)
az postgres flexible-server firewall-rule create \
  --resource-group pokehub_group \
  --name pokehub-pg-d65dd1 \
  --rule-name DevMachine --start-ip-address "$MYIP" --end-ip-address "$MYIP"
```

### Provisioning from scratch (disaster recovery)

If the server is lost, this is the exact sequence that recreates it. Only the **schema** is
recoverable from the repo — application data is not.

```bash
RG=pokehub_group
SERVER="pokehub-pg-$(openssl rand -hex 3)"     # globally-unique name
ADMIN=pokehubadmin
PGPASS='<generate-a-strong-password>'
MYIP=$(curl -s https://api.ipify.org)

# 1. Create the server (Central US; adjust region if restricted)
az postgres flexible-server create \
  --resource-group "$RG" --name "$SERVER" --location centralus \
  --tier Burstable --sku-name Standard_B1ms --storage-size 32 --version 16 \
  --admin-user "$ADMIN" --admin-password "$PGPASS" \
  --public-access "$MYIP" --yes

# 2. Allow Azure resources (Container App) + create the database
az postgres flexible-server firewall-rule create --resource-group "$RG" --name "$SERVER" \
  --rule-name AllowAzureServices --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0
az postgres flexible-server db create --resource-group "$RG" --server-name "$SERVER" --database-name pokehub

# 3. Apply migrations (rebuilds the schema)
export DB_HOST="$SERVER.postgres.database.azure.com" DB_PORT=5432 DB_NAME=pokehub \
       DB_USER="$ADMIN" DB_PASSWORD="$PGPASS" DB_SSL=true
npx tsx --tsconfig tsconfig.base.json node_modules/drizzle-kit/bin.cjs migrate --config=drizzle.config.pg.ts
```

Then point the app at it: update the Container App secrets **and** the GitHub secrets (below), and
redeploy the API.

### Keeping credentials in sync — READ THIS

The database credentials live in **three** places. All three must agree, or the app or the next
deployment will break:

1. **Container App secrets** on `pokehub-api` (`db-host`, `db-port`, `db-name`, `db-user`,
   `db-password`) — what the running container reads.
2. **`platform/container-apps/.env`** (gitignored) — the source `deploy.sh` templates into the
   Container App manifest when deploying locally.
3. **GitHub repository secrets** (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) — what
   the `deploy.yml` GitHub Actions workflow uses to run migrations and to regenerate `.env` in CI.

> ⚠️ **If you change the database, update the GitHub secrets too.** `deploy.yml` recreates `.env`
> from GitHub secrets on every run, so a stale `DB_*` secret will silently revert production to the
> old database on the next deploy — even though the live Container App looks correct.

Update the Container App secrets:

```bash
az containerapp secret set --name pokehub-api --resource-group pokehub_group --secrets \
  db-host=<host> db-port=5432 db-name=pokehub db-user=<user> db-password=<password>
# secrets only take effect on a new revision — redeploy or restart the active revision
```

Update the GitHub secrets:

```bash
gh secret set DB_HOST --body '<host>'
gh secret set DB_PORT --body '5432'
gh secret set DB_NAME --body 'pokehub'
gh secret set DB_USER --body '<user>'
gh secret set DB_PASSWORD --body '<password>'
```

## Local development

Start a disposable Postgres and point Drizzle at it:

```bash
docker run -d --name pokehub-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pokehub_dev \
  -p 5432:5432 postgres:15-alpine

export DB_HOST=localhost DB_PORT=5432 DB_NAME=pokehub_dev DB_USER=postgres DB_PASSWORD=postgres DB_SSL=false

# Push the schema directly (fast, dev-only — skips migration files)
npx tsx --tsconfig tsconfig.base.json node_modules/drizzle-kit/bin.cjs push --config=drizzle.config.pg.ts
```

| Setting | Local | Production |
| --- | --- | --- |
| Host | `localhost` | `pokehub-pg-d65dd1.postgres.database.azure.com` |
| Database | `pokehub_dev` | `pokehub` |
| SSL | disabled | required (`DB_SSL=true`) |

## Schema

The schema is defined across the backend DB packages and assembled in `drizzle.config.pg.ts`:

- `packages/backend/pokehub-users-db` → `users`
- `packages/backend/pokehub-teams-db` → `teams`
- `packages/backend/pokehub-battles-db` → `battle_replays`

Committed migrations live in `drizzle/`. A release only picks up schema changes if the generated
migration files are committed, because `deploy.yml` runs `drizzle-kit migrate` before deploying the
API.

## Security notes

- Never commit `.env`, `.env.local`, `.env.production`, or `platform/container-apps/.env`. Use
  `platform/container-apps/.env.template` as the reference for required variables.
- Production always uses SSL. Rotate the admin password via
  `az postgres flexible-server update --admin-password`, then sync all three credential locations
  above.

## Related

- [Release & Deploy runbook](./release-and-deploy.md) — how migrations and deploys are triggered.
- [`db-migrate` skill](../../.agents/skills/db-migrate/SKILL.md) — the exact Drizzle invocation.
- [Container Apps troubleshooting](./container-apps/troubleshooting.md) — DB/Redis connection issues.
