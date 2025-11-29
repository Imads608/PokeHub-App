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

```bash
# From project root
docker build --no-cache -t pokehub-api -f apps/pokehub-api/Dockerfile .
docker tag pokehub-api pokehub.azurecr.io/pokehub-api:dev
docker push pokehub.azurecr.io/pokehub-api:dev
```

### 3. Deploy

```bash
# From this directory (platform/container-apps)
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
