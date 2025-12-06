# Azure Container Apps - Quick Reference

This directory contains the Azure Container Apps configuration and deployment scripts for PokeHub.

## Documentation

For complete guides, see the [docs/deployment](../../docs/deployment/) directory:

- **[Deployment Overview](../../docs/deployment/README.md)** - Architecture and getting started
- **[Setup Guide](../../docs/deployment/container-apps/setup.md)** - Initial deployment instructions
- **[Operations Guide](../../docs/deployment/container-apps/operations.md)** - Day-to-day management
- **[Troubleshooting](../../docs/deployment/container-apps/troubleshooting.md)** - Common issues and solutions
- **[Database Setup](../../docs/deployment/database.md)** - Database configuration
- **[Deployment Status](../../docs/deployment/status.md)** - Current deployment status

## Files in This Directory

- `pokehub-api.yaml` - Backend API configuration
- `pokehub-app.yaml` - Frontend application configuration
- `.env.template` - Template for secrets (copy to `.env` and fill in values)
- `.env` - Actual secrets (not committed to git)
- `deploy.sh` - Helper script to deploy with secrets substitution

## Quick Start

### 1. Setup Secrets

```bash
cp .env.template .env
# Edit .env with your actual values
```

### 2. Build and Push Image

**Recommended: Use ACR Build** (avoids local network issues with large images)

```bash
# Backend API
cd /path/to/PokeHub-App
az acr build \
  --registry pokehub \
  --image pokehub-api:dev \
  --file apps/pokehub-api/Dockerfile \
  .

# Frontend App (requires build args for Next.js)
cd /path/to/PokeHub-App
az acr build \
  --registry pokehub \
  --image pokehub-app:dev \
  --build-arg NEXT_PUBLIC_POKEHUB_API_URL=https://api.pokehub.space/api \
  --file apps/pokehub-app/Dockerfile \
  .
```

**Alternative: Local Build + Push** (may fail with network issues on large images)

```bash
# From project root
docker build --no-cache -t pokehub-api -f apps/pokehub-api/Dockerfile .
docker tag pokehub-api pokehub.azurecr.io/pokehub-api:dev
docker push pokehub.azurecr.io/pokehub-api:dev
```

> **Note**: Local docker push can fail with "connection reset" errors when pushing large images (800MB+). ACR build is more reliable as it builds directly on Azure infrastructure.

### 3. Deploy

```bash
# From this directory (platform/container-apps)
./deploy.sh pokehub-api
```

## Building Frontend vs Backend

### Frontend (pokehub-app)

The frontend build **requires** build arguments for Next.js environment variables:

```bash
az acr build \
  --registry pokehub \
  --image pokehub-app:dev \
  --build-arg NEXT_PUBLIC_POKEHUB_API_URL=https://api.pokehub.space/api \
  --file apps/pokehub-app/Dockerfile \
  .
```

**Why build args are needed:**
- Next.js bakes `NEXT_PUBLIC_*` variables into the JavaScript bundle at build time
- These variables are used for client-side API calls
- Without the build arg, the frontend won't know which API to connect to

### Backend (pokehub-api)

The backend doesn't require build args - all configuration is provided at runtime:

```bash
az acr build \
  --registry pokehub \
  --image pokehub-api:dev \
  --file apps/pokehub-api/Dockerfile \
  .
```

## Complete Build & Deploy Process

**Frontend:**
```bash
# 1. Build image on Azure (from repo root)
az acr build \
  --registry pokehub \
  --image pokehub-app:dev \
  --build-arg NEXT_PUBLIC_POKEHUB_API_URL=https://api.pokehub.space/api \
  --file apps/pokehub-app/Dockerfile \
  .

# 2. Deploy (from platform/container-apps)
cd platform/container-apps
./deploy.sh pokehub-app
```

**Backend:**
```bash
# 1. Build image on Azure (from repo root)
az acr build \
  --registry pokehub \
  --image pokehub-api:dev \
  --file apps/pokehub-api/Dockerfile \
  .

# 2. Deploy (from platform/container-apps)
cd platform/container-apps
./deploy.sh pokehub-api
```

## Common Commands

### View Logs

```bash
# Real-time logs
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --follow

# Last 50 lines
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --tail 50 \
  --follow false
```

### Check Status

```bash
az containerapp show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --query "properties.runningStatus" \
  -o tsv
```

### Force Restart

```bash
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --set-env-vars "RESTART=$(date +%s)"
```

## URLs

| Service | URL |
|---------|-----|
| Backend API | https://api.pokehub.space |
| Backend (default) | https://pokehub-api.kindglacier-9db9a67b.eastus.azurecontainerapps.io |
| Frontend | https://pokehub.space |

## Need Help?

- See the [full operations guide](../../docs/deployment/container-apps/operations.md) for more commands
- Check [troubleshooting](../../docs/deployment/container-apps/troubleshooting.md) for common issues
