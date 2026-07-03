# PokeHub Deployment Status

**Last Updated:** 2026-07-03

## Current Status

### Completed

- [x] Azure Container Apps Environment (`pokehub-env`)
- [x] Azure Database for PostgreSQL — Flexible Server (migrated off Supabase, July 2026)
- [x] Database migrations applied to Azure Postgres
- [x] Backend API Container App (`pokehub-api`)
- [x] Frontend Container App (`pokehub-app`)
- [x] Custom domain DNS records for API (`api.pokehub.space`) and frontend (`www.pokehub.space`)
- [x] SSL Certificates (SNI enabled)
- [x] Azure Cache for Redis (`pokehub-cache`, Basic C0)
- [x] Redis secrets added to GitHub Actions pipeline
- [x] GitHub Actions CI/CD workflows (`ci.yml`, `release.yml`, `deploy.yml`)

## URLs

| Service | Default URL | Custom Domain | Status |
|---------|-------------|---------------|--------|
| Backend API | https://pokehub-api.kindglacier-9db9a67b.eastus.azurecontainerapps.io | https://api.pokehub.space | Running |
| Frontend | https://pokehub-app.kindglacier-9db9a67b.eastus.azurecontainerapps.io | https://www.pokehub.space | Running |

## Database

- **Provider:** Azure Database for PostgreSQL — Flexible Server (Burstable B1ms, Central US)
- **Host:** pokehub-pg-d65dd1.postgres.database.azure.com
- **Database:** pokehub
- **User:** pokehubadmin
- **Connection:** SSL required (production)

See [database.md](./database.md) for full details.

## Container Registry

- **Registry:** pokehub.azurecr.io
- **Images:**
  - `pokehub-api:<version>` (Backend API)
  - `pokehub-app:<version>` (Frontend)

## Redis

- **Provider:** Azure Cache for Redis (Basic C0)
- **Host:** pokehub-cache.redis.cache.windows.net
- **Port:** 6380 (SSL)
- **TLS:** 1.2 (required)
- **Auth:** Access Keys

## Cost Estimate

| Resource | Monthly Cost |
|----------|--------------|
| Container Apps (both apps, min 1 replica each) | ~$70-90 |
| Azure Cache for Redis (Basic C0) | ~$16 |
| Azure Database for PostgreSQL (Burstable B1ms) | ~$12-15 |
| Container Registry (Basic) | ~$5-17 |
| Load Balancer + VNet + DNS | ~$20-25 |
| **Total** | **~$150-160/month** |
