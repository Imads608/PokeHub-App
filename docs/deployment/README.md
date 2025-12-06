# PokeHub Deployment Guide

This directory contains all deployment-related documentation for the PokeHub application.

## Quick Links

- **[Container Apps Setup](./container-apps/setup.md)** - Initial Azure Container Apps setup
- **[Container Apps Operations](./container-apps/operations.md)** - Day-to-day management
- **[Troubleshooting](./container-apps/troubleshooting.md)** - Common issues and solutions
- **[Database Setup](./database.md)** - Database configuration guide
- **[Deployment Status](./status.md)** - Current deployment status
- **[DNS & Multi-Region Options](./dns-and-multi-region.md)** - Apex domain support and multi-region deployment strategies

## Architecture Overview

PokeHub is deployed on **Azure Container Apps**, a serverless container platform that provides:

- Auto-scaling from 1-3 replicas based on load
- Managed SSL certificates for custom domains
- Built-in load balancing and ingress
- Integration with Azure Container Registry

### Components

```
┌─────────────────────────────────────────────────┐
│         Azure Container Apps Environment        │
│                  (pokehub-env)                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────┐    ┌──────────────────┐  │
│  │   pokehub-api   │    │   pokehub-app    │  │
│  │   (Backend)     │    │   (Frontend)     │  │
│  │                 │    │                  │  │
│  │ api.pokehub     │    │ pokehub.space    │  │
│  │ .space          │    │                  │  │
│  └────────┬────────┘    └──────────────────┘  │
│           │                                     │
└───────────┼─────────────────────────────────────┘
            │
            ▼
    ┌───────────────┐
    │   Supabase    │
    │   PostgreSQL  │
    │   Database    │
    └───────────────┘
```

### Resources

- **Backend API** (`pokehub-api`)
  - Domain: `api.pokehub.space`
  - Image: `pokehub.azurecr.io/pokehub-api:dev`
  - Resources: 1 CPU, 2 GB RAM
  - Replicas: 1-3 (auto-scaling)

- **Frontend** (`pokehub-app`)
  - Domain: `pokehub.space`
  - Image: `pokehub.azurecr.io/pokehub-app:dev`
  - Resources: 1 CPU, 2 GB RAM
  - Replicas: 1-3 (auto-scaling)

- **Database**
  - Provider: Supabase (500MB free tier)
  - Connection: IPv4-compatible pooler
  - SSL: Required in production

## Getting Started

### Prerequisites

- Docker installed and running
- Azure CLI installed (`az login`)
- ACR credentials configured
- Supabase account and database

### Deployment Steps

1. **[Database Setup](./database.md)**
   - Configure environment files
   - Run migrations

2. **[Container Apps Setup](./container-apps/setup.md)**
   - Configure secrets
   - Build and push Docker images
   - Deploy backend and frontend

3. **[Testing](./container-apps/operations.md#viewing-logs)**
   - View application logs
   - Test endpoints

## Common Tasks

### Deploy an Update

```bash
# 1. Build and push image
docker build --no-cache -t pokehub-api -f apps/pokehub-api/Dockerfile .
docker tag pokehub-api pokehub.azurecr.io/pokehub-api:dev
docker push pokehub.azurecr.io/pokehub-api:dev

# 2. Deploy
cd platform/container-apps && ./deploy.sh pokehub-api
```

See [operations.md](./container-apps/operations.md) for more details.

### View Logs

```bash
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --tail 50 \
  --follow false
```

See [operations.md](./container-apps/operations.md#viewing-logs) for more log commands.

### Troubleshoot Issues

Check the [troubleshooting guide](./container-apps/troubleshooting.md) for common issues and solutions.

## Cost Information

| Resource | Monthly Cost |
|----------|--------------|
| Container Apps Environment | ~$25-35 |
| Backend API (1-3 replicas) | ~$15-20 |
| Frontend App (1-3 replicas) | ~$15-20 |
| Supabase Free Tier | $0 |
| Azure DNS | ~$0.50 |
| **Total** | **~$55-75/month** |

**Savings vs AKS**: ~$52-78/month ($624-936 annually)

## Additional Resources

- [Azure Container Apps Documentation](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Supabase Documentation](https://supabase.com/docs)
- [Deployment Status](./status.md) - Track deployment progress
