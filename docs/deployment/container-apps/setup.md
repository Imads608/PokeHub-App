# Azure Container Apps Setup Guide

This guide covers the initial setup and deployment of PokeHub to Azure Container Apps.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Manual Deployment](#manual-deployment)
- [Architecture](#architecture)
- [Security Notes](#security-notes)
- [Cost Estimate](#cost-estimate)
- [Next Steps](#next-steps)

---

## Prerequisites

- Docker installed and running
- Azure CLI installed and logged in (`az login`)
- ACR credentials configured

## Initial Setup

### 1. Copy the secrets template

From `platform/container-apps/`:

```bash
cp .env.template .env
```

### 2. Fill in the secrets in `.env`

- Get ACR password: `az acr credential show --name pokehub --query "passwords[0].value" -o tsv`
- Set DB_PASSWORD to your Azure PostgreSQL admin password (see [database.md](../database.md))
- Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
- Get Google OAuth credentials from Google Cloud Console

### 3. Build Docker Images

From the project root (`/home/imads608/Work/PokeHub-App`):

```bash
# Build backend
docker build --no-cache -t pokehub-api -f apps/pokehub-api/Dockerfile .

# Build frontend
docker build --no-cache -t pokehub-app -f apps/pokehub-app/Dockerfile .
```

**Note**: Use `--no-cache` to ensure fresh build without cached layers.

### 4. Push to Azure Container Registry

```bash
# Tag for ACR
docker tag pokehub-api pokehub.azurecr.io/pokehub-api:dev
docker tag pokehub-app pokehub.azurecr.io/pokehub-app:dev

# Push to ACR
docker push pokehub.azurecr.io/pokehub-api:dev
docker push pokehub.azurecr.io/pokehub-app:dev
```

### 5. Deploy the backend

From `platform/container-apps/`:

```bash
./deploy.sh pokehub-api
```

The deploy script will:
1. Load secrets from `.env` file
2. Substitute placeholders in YAML config
3. Create or update the container app
4. Display the app URL

### 6. Get the backend URL and update frontend config

```bash
az containerapp show --name pokehub-api --resource-group pokehub_group --query "properties.configuration.ingress.fqdn" -o tsv
```

Update `API_URL` in `.env` with `https://<backend-fqdn>`

### 7. Deploy the frontend

```bash
./deploy.sh pokehub-app
```

## Manual Deployment

If you prefer to deploy manually without the script:

```bash
# Replace secrets in YAML file
cp pokehub-api.yaml pokehub-api.deploy.yaml
sed -i "s|REPLACE_WITH_ACR_PASSWORD|$ACR_PASSWORD|g" pokehub-api.deploy.yaml
sed -i "s|REPLACE_WITH_DB_PASSWORD|$DB_PASSWORD|g" pokehub-api.deploy.yaml

# Deploy
az containerapp create \
  --name pokehub-api \
  --resource-group pokehub_group \
  --yaml pokehub-api.deploy.yaml

# Clean up temporary file
rm pokehub-api.deploy.yaml
```

## Architecture

### Current Infrastructure

- **Environment**: `pokehub-env` (East US)
- **Backend API**: `pokehub-api`
  - Custom domain: `api.pokehub.space` (SSL enabled)
  - Resources: 1-3 replicas, 1 CPU, 2 GB RAM
  - Connected to Azure Database for PostgreSQL (SSL)
- **Frontend**: `pokehub-app`
  - Custom domain: `pokehub.space`
  - Resources: 1-3 replicas, 1 CPU, 2 GB RAM

### Database

- **Provider**: Azure Database for PostgreSQL — Flexible Server (Burstable B1ms, Central US)
- **Host**: `pokehub-pg-d65dd1.postgres.database.azure.com`
- **SSL**: Required in production
- **Migrations**: Managed via Drizzle ORM

See [database.md](../database.md) for switching between local and production databases.

### Redis

- **Provider**: Azure Cache for Redis (Basic C0)
- **Host**: `pokehub-cache.redis.cache.windows.net`
- **Port**: 6380 (SSL)
- **TLS**: 1.2 (required)
- **Auth**: Access Keys
- **Used for**: Battle state management, matchmaking queues, pub/sub messaging

## Security Notes

- **Never commit `.env` file** - it's already in `.gitignore`
- Secrets in YAML are encrypted by Azure
- Container images exclude `.env` files (configured in `.dockerignore`)
- For production, consider using Azure Key Vault integration
- SSL certificates are managed automatically by Azure

## Cost Estimate

| Resource | Monthly Cost |
|----------|--------------|
| Container Apps (both apps, min 1 replica each) | ~$70-90 |
| Azure Cache for Redis (Basic C0) | ~$16 |
| Azure Database for PostgreSQL (Burstable B1ms) | ~$12-15 |
| Container Registry (Basic) | ~$5-17 |
| Load Balancer + VNet + DNS | ~$20-25 |
| **Total** | **~$150-160/month** |

## Next Steps

After deployment, see:
- [operations.md](./operations.md) - Day-to-day operations
- [troubleshooting.md](./troubleshooting.md) - Common issues and solutions
