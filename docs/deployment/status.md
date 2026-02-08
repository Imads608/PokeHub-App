# PokeHub Deployment Status

**Last Updated:** 2025-11-29 08:17 UTC

## Current Status

### Completed

- [x] Azure Container Apps Environment (`pokehub-env`)
- [x] Supabase Database (500MB free tier)
- [x] Database migrations to Supabase
- [x] Backend API Container App (`pokehub-api`)
- [x] Custom domain DNS records for API (`api.pokehub.space`)
- [x] SSL Certificate for `api.pokehub.space` (SNI enabled)
- [x] Environment configuration system (`.env.local` and `.env.production`)
- [x] Fixed IPv6 connectivity (using Supabase pooler with IPv4)
- [x] Docker build configuration (excluded `.env` files from image)
- [x] Backend successfully deployed and running
- [x] Azure Cache for Redis (`pokehub-cache`, Basic C0)
- [x] Redis secrets added to GitHub Actions pipeline

### In Progress

- [ ] Testing Backend Endpoints

### Pending

- [ ] Frontend Container App deployment
- [ ] Custom domain for frontend (`pokehub.space`)
- [ ] End-to-end testing
- [ ] GitHub Actions CI/CD workflow

## URLs

| Service | Default URL | Custom Domain | Status |
|---------|-------------|---------------|--------|
| Backend API | https://pokehub-api.kindglacier-9db9a67b.eastus.azurecontainerapps.io | https://api.pokehub.space | Running |
| Frontend | TBD | https://pokehub.space | Not deployed |

## Database

- **Provider:** Supabase (Connection Pooler)
- **Host:** aws-1-us-east-1.pooler.supabase.com (IPv4 compatible)
- **Database:** postgres
- **User:** postgres.wxrhnixjscveeamupgam
- **Connection:** SSL required (production)

## Container Registry

- **Registry:** pokehub.azurecr.io
- **Images:**
  - `pokehub-api:dev` (Backend API)
  - `pokehub-app:dev` (Frontend - to be built)

## Redis

- **Provider:** Azure Cache for Redis (Basic C0)
- **Host:** pokehub-cache.redis.cache.windows.net
- **Port:** 6380 (SSL)
- **TLS:** 1.2 (required)
- **Auth:** Access Keys

## Cost Estimate

| Resource | Monthly Cost |
|----------|--------------|
| Container Apps Environment | ~$25-35 |
| Backend API (1-3 replicas, 1 CPU, 2 GB) | ~$15-20 |
| Frontend App (1-3 replicas, 1 CPU, 2 GB) | ~$15-20 |
| Azure Cache for Redis (Basic C0) | ~$16 |
| Supabase Free Tier | $0 |
| Azure DNS | ~$0.50 |
| **Total** | **~$71-91/month** |

## Next Steps

1. Test backend endpoints
2. Build and deploy frontend
3. Set up custom domain for frontend
4. Configure GitHub Actions workflow
