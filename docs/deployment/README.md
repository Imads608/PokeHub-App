# PokeHub Deployment Guide

This directory contains all deployment-related documentation for the PokeHub application.

## Quick Links

- **[Container Apps Setup](./container-apps/setup.md)** - Initial Azure Container Apps setup
- **[Container Apps Operations](./container-apps/operations.md)** - Day-to-day management
- **[Troubleshooting](./container-apps/troubleshooting.md)** - Common issues and solutions
- **[Database Setup](./database.md)** - Database configuration guide
- **[Release & Deploy Runbook](./release-and-deploy.md)** - How to ship: tag → images → deploy
- **[CI/CD Workflows](./ci-cd-workflows.md)** - Workflow details and required secrets
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
       ┌────┴────┐
       │         │
       ▼         ▼
┌───────────┐  ┌─────────────────┐
│  Azure    │  │ Azure Cache     │
│ PostgreSQL│  │ for Redis       │
│ (Flexible │  │ (pokehub-cache) │
│  Server)  │  │                 │
└───────────┘  └─────────────────┘
```

### Resources

- **Backend API** (`pokehub-api`)
  - Domain: `api.pokehub.space`
  - Image: `pokehub.azurecr.io/pokehub-api:<version>`
  - Resources: 1 CPU, 2 GB RAM
  - Replicas: 1-3 (auto-scaling)

- **Frontend** (`pokehub-app`)
  - Domain: `pokehub.space`
  - Image: `pokehub.azurecr.io/pokehub-app:<version>`
  - Resources: 1 CPU, 2 GB RAM
  - Replicas: 1-3 (auto-scaling)

- **Database**
  - Provider: Azure Database for PostgreSQL — Flexible Server (Burstable B1ms, Central US)
  - Server: `pokehub-pg-d65dd1.postgres.database.azure.com`, database `pokehub`
  - SSL: Required in production
  - Details: [database.md](./database.md)

- **Redis** (`pokehub-cache`)
  - Provider: Azure Cache for Redis (Basic C0)
  - Host: `pokehub-cache.redis.cache.windows.net`
  - Port: 6380 (SSL)
  - TLS: 1.2 (required)
  - Auth: Access Keys

## Getting Started

### Prerequisites

- Docker installed and running
- Azure CLI installed (`az login`)
- ACR credentials configured
- Access to the Azure `pokehub_group` resource group (Container Apps, PostgreSQL, Redis)

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

The standard path is the GitHub Actions pipeline — tag a release to build images, then run the
deploy workflow. See the **[Release & Deploy runbook](./release-and-deploy.md)**.

```bash
# 1. Cut a release (builds + pushes images to ACR)
git tag v0.3.2 && git push origin v0.3.2

# 2. Deploy it (manual, with approval)
gh workflow run "Deploy to Azure Container Apps" -f version=v0.3.2 -f app=both
```

For a manual (no-CI) deploy from `platform/container-apps/`, see
[operations.md](./container-apps/operations.md).

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

Approximate monthly cost (see [dns-and-multi-region.md](./dns-and-multi-region.md) for the detailed
breakdown; actual spend has run ~$150-160/month, driven mostly by always-on Container Apps replicas):

| Resource | Monthly Cost |
|----------|--------------|
| Container Apps (both apps, min 1 replica each) | ~$70-90 |
| Azure Cache for Redis (Basic C0) | ~$16 |
| Azure Database for PostgreSQL (Burstable B1ms) | ~$12-15 |
| Container Registry (Basic) | ~$5-17 |
| Load Balancer + VNet + DNS | ~$20-25 |
| **Total** | **~$150-160/month** |

> **Cost lever:** the biggest driver is `minReplicas: 1` on both apps (always-on compute). Setting
> `minReplicas: 0` lets idle apps scale to zero at the cost of cold starts. See
> [operations.md](./container-apps/operations.md) for scaling commands.

## Additional Resources

- [Azure Container Apps Documentation](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Azure Database for PostgreSQL — Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/)
- [Deployment Status](./status.md) - Track deployment progress
