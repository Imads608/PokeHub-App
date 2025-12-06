# Azure Container Apps Operations

This guide covers common day-to-day operations for managing the PokeHub Container Apps deployment.

## Table of Contents
- [Building and Deploying Updates](#building-and-deploying-updates)
- [Viewing Logs](#viewing-logs)
- [Updating Resources](#updating-resources)
- [Deleting Resources](#deleting-resources)
- [Quick Reference](#quick-reference)

---

## Building and Deploying Updates

### Build Docker Image

From the project root (`/home/imads608/Work/PokeHub-App`):

```bash
# Build backend
docker build --no-cache -t pokehub-api -f apps/pokehub-api/Dockerfile .

# Build frontend
docker build --no-cache -t pokehub-app -f apps/pokehub-app/Dockerfile .
```

### Push to Azure Container Registry

```bash
# Tag for ACR
docker tag pokehub-api pokehub.azurecr.io/pokehub-api:dev
docker tag pokehub-app pokehub.azurecr.io/pokehub-app:dev

# Push to ACR
docker push pokehub.azurecr.io/pokehub-api:dev
docker push pokehub.azurecr.io/pokehub-app:dev
```

### Deploy Using Script

From `platform/container-apps/`:

```bash
# Deploy backend
./deploy.sh pokehub-api

# Deploy frontend
./deploy.sh pokehub-app
```

### Force New Revision

If the image tag hasn't changed but you want to force pulling the latest image:

```bash
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --set-env-vars "DEPLOYMENT_TIME=$(date +%s)" \
  --output none
```

This adds a timestamp environment variable to trigger a new revision.

---

## Viewing Logs

### Real-time Logs (Streaming)

```bash
# Stream logs from backend
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --follow

# Stream logs from frontend
az containerapp logs show \
  --name pokehub-app \
  --resource-group pokehub_group \
  --follow
```

Press `Ctrl+C` to stop streaming.

### Recent Logs (Last N Lines)

```bash
# Show last 50 lines
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --tail 50 \
  --follow false

# Show last 100 lines
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --tail 100 \
  --follow false
```

### Filter Logs

```bash
# Show only error logs
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --tail 100 \
  --follow false \
  | grep -i error

# Show logs for specific time range (JSON format)
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --format json \
  | jq '.[] | select(.TimeStamp > "2025-11-29T08:00:00")'
```

### View System Logs

```bash
# View console logs
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --type console

# View system logs
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --type system
```

---

## Updating Resources

### Update Environment Variables

```bash
# Update single environment variable
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --set-env-vars "NODE_ENV=production"

# Update multiple environment variables
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --set-env-vars \
    "NODE_ENV=production" \
    "DB_HOST=new-host.supabase.co"

# Remove environment variable
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --remove-env-vars "DEPLOYMENT_TIME"
```

### Update Secrets

```bash
# Update secret value
az containerapp secret set \
  --name pokehub-api \
  --resource-group pokehub_group \
  --secrets db-password="new-password-here"

# List current secrets
az containerapp secret list \
  --name pokehub-api \
  --resource-group pokehub_group \
  -o table
```

**Note**: After updating secrets, you may need to trigger a new revision for changes to take effect.

### Update Resource Allocation

```bash
# Scale CPU and memory
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --cpu 2.0 \
  --memory 4Gi

# Scale replicas
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --min-replicas 2 \
  --max-replicas 5
```

### Update Image

```bash
# Update to new image
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --image pokehub.azurecr.io/pokehub-api:v2.0
```

### Update Using YAML

Edit the YAML file (`pokehub-api.yaml` or `pokehub-app.yaml`), then:

```bash
./deploy.sh pokehub-api
```

---

## Deleting Resources

### Delete Container App

```bash
# Delete backend
az containerapp delete \
  --name pokehub-api \
  --resource-group pokehub_group \
  --yes

# Delete frontend
az containerapp delete \
  --name pokehub-app \
  --resource-group pokehub_group \
  --yes
```

### Delete Custom Domain

```bash
# Remove custom domain binding
az containerapp hostname delete \
  --name pokehub-api \
  --resource-group pokehub_group \
  --hostname api.pokehub.space \
  --yes
```

### Delete Container Apps Environment

**Warning**: This will delete all apps in the environment!

```bash
az containerapp env delete \
  --name pokehub-env \
  --resource-group pokehub_group \
  --yes
```

### Delete ACR Images

```bash
# List images
az acr repository list \
  --name pokehub \
  -o table

# Delete specific tag
az acr repository delete \
  --name pokehub \
  --image pokehub-api:dev \
  --yes

# Delete all tags for a repository
az acr repository delete \
  --name pokehub \
  --repository pokehub-api \
  --yes
```

---

## Quick Reference

### Most Common Commands

```bash
# Build and deploy backend
docker build --no-cache -t pokehub-api -f apps/pokehub-api/Dockerfile .
docker tag pokehub-api pokehub.azurecr.io/pokehub-api:dev
docker push pokehub.azurecr.io/pokehub-api:dev
cd platform/container-apps && ./deploy.sh pokehub-api

# View logs
az containerapp logs show --name pokehub-api --resource-group pokehub_group --tail 50 --follow false

# Force restart
az containerapp update --name pokehub-api --resource-group pokehub_group --set-env-vars "RESTART=$(date +%s)"

# Check status
az containerapp show --name pokehub-api --resource-group pokehub_group --query "properties.runningStatus" -o tsv
```

### Useful Aliases

Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
# Container Apps aliases
alias capp-logs='az containerapp logs show --name pokehub-api --resource-group pokehub_group'
alias capp-status='az containerapp show --name pokehub-api --resource-group pokehub_group --query "properties.runningStatus" -o tsv'
alias capp-restart='az containerapp update --name pokehub-api --resource-group pokehub_group --set-env-vars "RESTART=$(date +%s)"'
```

---

## Additional Resources

- [Azure Container Apps Documentation](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Azure CLI Container Apps Reference](https://learn.microsoft.com/en-us/cli/azure/containerapp)
- [Troubleshooting Guide](./troubleshooting.md)
