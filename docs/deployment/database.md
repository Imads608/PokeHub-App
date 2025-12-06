# Database Setup Guide

This project supports both local development and production (Supabase) databases.

## Environment Files

- **`.env.local`** - Local development with PostgreSQL
- **`.env.production`** - Production with Supabase
- **`.env`** - Active environment (copy from .local or .production)

## Quick Start

### For Local Development

1. Start a local PostgreSQL instance:
   ```bash
   docker run -d \
     --name pokehub-postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=pokehub_dev \
     -p 5432:5432 \
     postgres:14-alpine
   ```

2. Copy the local environment:
   ```bash
   cp .env.local .env
   ```

3. Run migrations:
   ```bash
   npx drizzle-kit push --config=drizzle.config.pg.ts
   ```

### For Production (Supabase)

1. Copy the production environment:
   ```bash
   cp .env.production .env
   ```

2. Run migrations:
   ```bash
   npx drizzle-kit push --config=drizzle.config.pg.ts
   ```

## Configuration Details

### Local (.env.local)
- Host: localhost
- Port: 5432
- Database: pokehub_dev
- SSL: disabled

### Production (.env.production)
- Host: Supabase
- Port: 5432
- Database: postgres
- SSL: enabled (required)

## Switching Environments

Simply copy the appropriate environment file:

```bash
# Switch to local
cp .env.local .env

# Switch to production
cp .env.production .env
```

## Security Notes

- Never commit `.env`, `.env.local`, or `.env.production` to git
- These files contain sensitive credentials
- Use `.env.template` as a reference for required variables
