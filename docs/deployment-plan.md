# Cost-Optimized Azure Deployment Plan for PokeHub

## Executive Summary

**Current State**: AKS cluster with Emissary Ingress, cert-manager, Helm charts (~$85-125/month)

**Recommended Solution**: Azure Container Apps with Supabase PostgreSQL (~$47-68/month)

**Expected Savings**: $52-78/month ($624-936/year), staying well within $150/month budget

**Migration Effort**: Medium (2-3 weeks), containerized approach with minimal code changes

---

## Recommended Architecture: Azure Container Apps

### Why Container Apps?

1. **Cost-Effective**: ~60% of AKS cost while maintaining container-based deployment
2. **Balanced Complexity**: Container orchestration without K8s overhead
3. **Auto-Scaling**: Pay-per-use model with configurable min/max replicas
4. **Managed Services**: Built-in ingress, SSL certificates, monitoring
5. **Migration-Friendly**: Reuse existing Dockerfiles with minimal changes
6. **Perfect for Your Traffic**: Handles moderate traffic (hundreds-thousands users/month) efficiently

### Architecture Overview

```
Internet → Azure DNS (pokehub.space)
    ↓
Container Apps Environment
    ├─ Frontend (pokehub-app)
    │  ├─ Next.js in Docker container
    │  ├─ Min: 0, Max: 10 replicas (scales to 0 when idle)
    │  └─ Built-in HTTPS with managed certificate
    │
    ├─ Backend (pokehub-api)
    │  ├─ NestJS in Docker container
    │  ├─ Min: 1, Max: 5 replicas (always-on for DB connections)
    │  └─ Internal connection to PostgreSQL
    │
    └─ Shared ingress, logging, monitoring

External Services
    ├─ Supabase PostgreSQL (free tier, managed)
    ├─ Azure Blob Storage (avatars)
    ├─ Azure Container Registry (existing)
    └─ Google OAuth (external)
```

---

## Cost Breakdown

| Service | Specification | Monthly Cost |
|---------|--------------|--------------|
| **Frontend Container App** | 0.5 CPU, 1GB RAM, 1-10 replicas (min 1 always-on) | $20-30 |
| **Backend Container App** | 0.5 CPU, 1GB RAM, 1-5 replicas (min 1 always-on) | $20-30 |
| **Supabase PostgreSQL** | Free tier (500MB database, unlimited requests) | $0 |
| **Azure Container Registry** | Basic tier | $5 |
| **Azure DNS** | pokehub.space zone | $1 |
| **Azure Blob Storage** | Avatars (minimal usage) | $1-2 |
| **SSL Certificates** | Managed certificates | $0 |
| **Ingress/Load Balancing** | Built into Container Apps | $0 |
| **TOTAL** | | **$47-68/month** |

**Remaining Budget**: $82-103/month available for scaling or additional services

**Current AKS Cost**: $85-125/month (before database)

**Savings**: $52-78/month ($624-936 annually)

**Note**: Supabase free tier includes 500MB database storage, 50K monthly active users, 2GB bandwidth - sufficient for moderate traffic levels. Can upgrade to Pro ($25/month) if needed for 8GB database and no inactivity pausing.

---

## Migration Strategy

### Phase 1: Infrastructure Provisioning (Week 1)

**1.1 Create Container Apps Environment**

```bash
az containerapp env create \
  --name pokehub-env \
  --resource-group pokehub_group \
  --location eastus
```

**1.2 Set up Supabase PostgreSQL Database**

1. Go to https://supabase.com and create an account
2. Create a new project:
   - Project name: `pokehub`
   - Database password: Generate a strong password (save it securely!)
   - Region: Choose closest to East US (US East - North Virginia recommended)
   - Pricing: Select **Free** tier

3. Get your connection string from Project Settings → Database → Connection String (use "Connection pooling")

Example connection string:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**1.3 Update Local Configuration**

Update `drizzle.config.pg.ts` with Supabase credentials:
```typescript
dbCredentials: {
  ssl: true,  // Supabase requires SSL
  host: 'db.xxxxx.supabase.co',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres',
}
```

**1.4 Configure SSL for Production**

The postgres service automatically enables SSL when `NODE_ENV=production`:
```typescript
// postgres.service.ts handles this automatically
const isProd = process.env.NODE_ENV === 'production';
const sslParam = isProd ? '?sslmode=require' : '';
```

### Phase 2: Backend API Deployment (Week 1-2)

**2.1 Create Backend Container App Configuration**

Create file: `platform/container-apps/pokehub-api.yaml`

```yaml
properties:
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: true
      targetPort: 3000
      allowInsecure: false
      traffic:
        - latestRevision: true
          weight: 100
    secrets:
      - name: db-password
        value: ${DB_PASSWORD}
      - name: access-token
        value: ${ACCESS_TOKEN}
      - name: refresh-token
        value: ${REFRESH_TOKEN}
      - name: google-client-secret
        value: ${GOOGLE_CLIENT_SECRET}
      - name: azure-storage-key
        value: ${AZURE_STORAGE_ACCOUNT_KEY}
    registries:
      - server: pokehub.azurecr.io
        passwordSecretRef: acr-password
  template:
    containers:
      - name: pokehub-api
        image: pokehub.azurecr.io/pokehub-api:latest
        env:
          - name: DB_HOST
            value: pokehub-db.postgres.database.azure.com
          - name: DB_PORT
            value: "5432"
          - name: DB_USER
            value: pokehub_admin
          - name: DB_PASS
            secretRef: db-password
          - name: DB_NAME
            value: pokehub
          - name: ACCESS_TOKEN
            secretRef: access-token
          - name: ACCESS_TOKEN_EXPIRES
            value: "60"
          - name: REFRESH_TOKEN
            secretRef: refresh-token
          - name: REFRESH_TOKEN_EXPIRES
            value: "720"
          - name: GOOGLE_CLIENT_ID
            value: ${GOOGLE_CLIENT_ID}
          - name: AZURE_STORAGE_ACCOUNT
            value: pokehub
          - name: AZURE_STORAGE_CONTAINER
            value: avatars
          - name: AZURE_STORAGE_ACCOUNT_KEY
            secretRef: azure-storage-key
        resources:
          cpu: 0.5
          memory: 1Gi
    scale:
      minReplicas: 1  # Keep at least 1 running for DB connections
      maxReplicas: 5
      rules:
        - name: http-rule
          http:
            metadata:
              concurrentRequests: "10"
```

**2.2 Deploy Backend Container App**

```bash
az containerapp create \
  --name pokehub-api \
  --resource-group pokehub_group \
  --environment pokehub-env \
  --yaml platform/container-apps/pokehub-api.yaml
```

**2.3 Test Backend Endpoints**

```bash
# Get the backend URL
API_URL=$(az containerapp show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --query properties.configuration.ingress.fqdn \
  -o tsv)

# Test health endpoint
curl https://$API_URL/api/health
```

### Phase 3: Frontend Deployment (Week 2)

**3.1 Create Frontend Container App Configuration**

Create file: `platform/container-apps/pokehub-app.yaml`

```yaml
properties:
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: true
      targetPort: 3000
      allowInsecure: false
      traffic:
        - latestRevision: true
          weight: 100
    secrets:
      - name: auth-secret
        value: ${AUTH_SECRET}
      - name: auth-google-secret
        value: ${AUTH_GOOGLE_SECRET}
    registries:
      - server: pokehub.azurecr.io
        passwordSecretRef: acr-password
  template:
    containers:
      - name: pokehub-app
        image: pokehub.azurecr.io/pokehub-app:latest
        env:
          - name: AUTH_SECRET
            secretRef: auth-secret
          - name: AUTH_TRUST_HOST
            value: "true"
          - name: AUTH_GOOGLE_ID
            value: ${AUTH_GOOGLE_ID}
          - name: AUTH_GOOGLE_SECRET
            secretRef: auth-google-secret
          - name: POKEHUB_API_URL
            value: https://${BACKEND_FQDN}/api
          - name: NEXT_PUBLIC_POKEHUB_API_URL
            value: https://${BACKEND_FQDN}/api
        resources:
          cpu: 0.5
          memory: 1Gi
    scale:
      minReplicas: 1  # Keep at least 1 running for instant response (no cold starts)
      maxReplicas: 10
      rules:
        - name: http-rule
          http:
            metadata:
              concurrentRequests: "20"
```

**3.2 Deploy Frontend Container App**

```bash
az containerapp create \
  --name pokehub-app \
  --resource-group pokehub_group \
  --environment pokehub-env \
  --yaml platform/container-apps/pokehub-app.yaml
```

### Phase 4: Custom Domain & SSL (Week 2)

**4.1 Add Custom Domain to Frontend**

```bash
# Add custom domain
az containerapp hostname add \
  --name pokehub-app \
  --resource-group pokehub_group \
  --hostname pokehub.space

# Bind managed certificate (automatic SSL)
az containerapp hostname bind \
  --name pokehub-app \
  --resource-group pokehub_group \
  --hostname pokehub.space \
  --environment pokehub-env \
  --validation-method CNAME
```

**4.2 Update Azure DNS**

```bash
# Get Container App default domain
FRONTEND_FQDN=$(az containerapp show \
  --name pokehub-app \
  --resource-group pokehub_group \
  --query properties.configuration.ingress.fqdn \
  -o tsv)

# Update DNS CNAME record
az network dns record-set cname set-record \
  --resource-group pokehub_group \
  --zone-name pokehub.space \
  --record-set-name @ \
  --cname $FRONTEND_FQDN
```

**4.3 Update OAuth Callback URLs**

Update in Google Cloud Console:
- Authorized redirect URI: `https://pokehub.space/api/auth/callback/google`

### Phase 5: CI/CD Pipeline Updates (Week 2-3)

**5.1 Create New GitHub Actions Workflow**

Create file: `.github/workflows/deploy-container-apps.yml`

```yaml
name: Deploy to Azure Container Apps

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AZURE_CONTAINER_REGISTRY: pokehub.azurecr.io
  RESOURCE_GROUP: pokehub_group

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Log in to ACR
        run: az acr login --name pokehub

      - name: Build and push base image
        run: |
          docker build --rm --target app-base \
            -t pokehub-base -f Dockerfile .
          docker tag pokehub-base ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-base:${{ github.sha }}
          docker tag pokehub-base ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-base:latest
          docker push ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-base:${{ github.sha }}
          docker push ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-base:latest

      - name: Build and push API
        run: |
          docker build \
            --build-arg TAG=${{ github.sha }} \
            -t pokehub-api \
            -f apps/pokehub-api/Dockerfile .
          docker tag pokehub-api ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-api:${{ github.sha }}
          docker tag pokehub-api ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-api:latest
          docker push ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-api:${{ github.sha }}
          docker push ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-api:latest

      - name: Build and push App
        run: |
          docker build \
            --build-arg TAG=${{ github.sha }} \
            --build-arg NEXT_PUBLIC_POKEHUB_API_URL=${{ secrets.NEXT_PUBLIC_POKEHUB_API_URL }} \
            -t pokehub-app \
            -f apps/pokehub-app/Dockerfile .
          docker tag pokehub-app ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-app:${{ github.sha }}
          docker tag pokehub-app ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-app:latest
          docker push ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-app:${{ github.sha }}
          docker push ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-app:latest

      - name: Deploy API
        run: |
          az containerapp update \
            --name pokehub-api \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-api:${{ github.sha }}

      - name: Deploy App
        run: |
          az containerapp update \
            --name pokehub-app \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.AZURE_CONTAINER_REGISTRY }}/pokehub-app:${{ github.sha }}
```

**5.2 Update GitHub Secrets**

Add the following secrets to GitHub repository:
- `AZURE_CREDENTIALS` - Service principal credentials
- `NEXT_PUBLIC_POKEHUB_API_URL` - Backend API URL
- Database and OAuth secrets (if not using Azure Key Vault)

### Phase 6: Testing & Cutover (Week 3)

**6.1 Pre-Cutover Testing**

- [ ] API health check responding: `https://<api-fqdn>/api/health`
- [ ] Database connectivity verified
- [ ] Frontend loads correctly: `https://<app-fqdn>`
- [ ] Google OAuth login flow works
- [ ] Avatar upload to Azure Blob Storage works
- [ ] Custom domain resolves correctly
- [ ] SSL certificate valid and auto-renewing
- [ ] Auto-scaling triggers correctly under load

**6.2 Cutover Steps**

1. Update DNS to point pokehub.space to new Container App
2. Monitor logs and metrics for 24-48 hours
3. Keep AKS cluster running as backup during validation period
4. Once stable, decommission AKS cluster and associated resources

**6.3 Post-Cutover Validation**

- Monitor Container Apps logs via Azure Portal
- Check database connection stability
- Verify auto-scaling behavior
- Review cost metrics after first week

---

## Critical Files Requiring Changes

### 1. Database Configuration

**File**: `drizzle.config.pg.ts`

**Changes**: Update database credentials for Azure PostgreSQL

```typescript
dbCredentials: {
  ssl: true,  // Enable SSL for Azure PostgreSQL
  user: process.env.DB_USER || 'pokehub_admin',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'pokehub-db.postgres.database.azure.com',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || 'pokehub',
}
```

### 2. Backend Configuration

**File**: `apps/pokehub-api/src/config/configuration.ts`

**Changes**: Ensure environment variable defaults are production-safe (already looks good)

**Note**: The postgres.service.ts connection string has a typo (`postgress://` should be `postgres://`)

### 3. Dockerfiles

**File**: `apps/pokehub-app/Dockerfile`

**Status**: No changes needed - already compatible with Container Apps

**File**: `Dockerfile` (base image)

**Status**: No changes needed - can continue using for shared dependencies

### 4. CI/CD Workflows

**Files to Update**:
- `.github/workflows/build-dev.yaml` - Update or replace with Container Apps deployment
- `.github/workflows/build-pr.yaml` - Update for Container Apps testing
- `.github/workflows/build-release.yaml` - Update for production deployments

**Files to Create**:
- `.github/workflows/deploy-container-apps.yml` - New deployment workflow
- `platform/container-apps/pokehub-api.yaml` - Backend configuration
- `platform/container-apps/pokehub-app.yaml` - Frontend configuration

---

## Key Advantages Over Current AKS Setup

### Cost Savings
- **$30-70/month savings** ($360-840 annually)
- Pay-per-use pricing (frontend can scale to 0)
- No ingress controller costs
- No cert-manager infrastructure

### Simplification
- **No Helm charts needed** - replaced with simple YAML configs
- **No cert-manager** - managed SSL certificates included
- **No Emissary Ingress** - built-in ingress with routing
- **Automatic SSL renewal** - zero maintenance

### Operational Benefits
- Built-in monitoring via Log Analytics
- Auto-scaling without complex configuration
- Zero-downtime deployments
- Integrated with Azure ecosystem

### What You Keep
- Container-based deployment (Docker)
- Custom domain support (pokehub.space)
- Auto-scaling capabilities
- HTTPS/SSL encryption
- Azure Container Registry integration

---

## Potential Challenges & Mitigations

### Challenge 1: Database Connection Persistence

**Issue**: NestJS backend needs persistent database connections

**Mitigation**: Set `minReplicas: 1` for backend Container App to ensure at least one instance is always running

**Alternative**: If you want to allow scaling to 0, add connection retry logic to postgres.service.ts

### Challenge 2: Cold Start Latency

**Issue**: Frontend scaling from 0 can cause 2-3 second delay on first request

**Solution**: Set `minReplicas: 1` for frontend to ensure instant response times and better user experience (configured in plan)

### Challenge 3: Container Apps Learning Curve

**Issue**: Different deployment model from Kubernetes

**Mitigation**:
- Container Apps is simpler than K8s
- Good documentation and Azure CLI support
- YAML configuration similar to K8s

### Challenge 4: Database Size Limitations

**Issue**: B1ms PostgreSQL has 2GB RAM limit

**Mitigation**:
- Sufficient for moderate traffic (thousands of users)
- Easy upgrade path to B2s (4GB) for $30/month
- Monitor database metrics and scale proactively

---

## Rollback Plan

If issues arise during migration:

1. **DNS Rollback**: Update DNS back to AKS cluster (5-minute propagation)
2. **Database Rollback**: Restore from backup if data issues occur
3. **Keep AKS Running**: Maintain AKS for 1 week during validation period
4. **Phased Cutover**: Test with subdomain first before moving main domain

---

## Alternative Considered

### Azure App Service (B1 tier)

**Cost**: ~$48-54/month
**Pros**: Simple, always-on, no cold starts
**Cons**: Less flexible scaling, higher base cost for two services
**Decision**: Container Apps preferred for better auto-scaling and lower cost

---

## Success Metrics

- Monthly Azure spend under $75 (well within $150 budget)
- API response times < 200ms (p95)
- Frontend load time < 2 seconds
- Zero SSL certificate issues
- Successful auto-scaling during traffic spikes
- Database connection stability (no dropped connections)

---

## Timeline Summary

| Week | Phase | Key Activities |
|------|-------|----------------|
| Week 1 | Infrastructure | Provision Container Apps environment, PostgreSQL, migrate database |
| Week 1-2 | Backend | Deploy API Container App, configure secrets, test endpoints |
| Week 2 | Frontend | Deploy App Container App (min 1 replica), configure custom domain, update OAuth |
| Week 2-3 | CI/CD | Update GitHub Actions workflows, configure automated deployments |
| Week 3 | Cutover | DNS update, monitoring, validation, AKS decommission |

**Total Migration Time**: 2-3 weeks (part-time effort)

**Configuration Summary**:
- Frontend: Always-on (min 1 replica) for instant response times
- Backend: Always-on (min 1 replica) for database connection persistence
- Both services auto-scale based on demand
- No cold start delays for users

---

## Post-Migration Optimizations

Once stable, consider:

1. **Azure Key Vault Integration** - Centralized secret management (~$3/month)
2. **Application Insights** - Advanced monitoring (~$5-10/month)
3. **Database Reserved Instance** - 20% savings with 1-year commitment
4. **CDN for Static Assets** - Improve global performance
5. **Automated Backups** - Configure PostgreSQL backup retention

---

## Next Steps

1. Review this plan and confirm approach
2. Backup current AKS configuration and database
3. Provision Azure Container Apps environment and PostgreSQL
4. Begin Phase 1: Infrastructure setup
5. Test backend deployment
6. Test frontend deployment
7. Configure custom domain and SSL
8. Update CI/CD pipelines
9. Execute cutover plan
10. Monitor and optimize
