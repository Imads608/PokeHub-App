# CI/CD Pipeline Implementation Plan for PokeHub

## Overview

Implement a production-ready CI/CD pipeline using GitHub Actions that:
- Migrates from GitLab Container Registry to Azure Container Registry (ACR)
- Leverages Nx affected commands for optimal build performance
- Implements semantic versioning with manual deployment approval
- Deploys to Azure Container Apps (production only)
- Includes full quality gates: lint, test, build, E2E

## Architecture

### Three-Workflow Structure

```
Pull Requests → ci.yml (quality gates: lint, test, build, e2e)
                   ↓
Git Tag (v*.*.*)→ release.yml (build images, push to ACR, create release)
                   ↓
Manual Trigger → deploy.yml (deploy to Azure with approval)
```

**Rationale:**
- **ci.yml**: Fast feedback on PRs using Nx affected (only test changed code)
- **release.yml**: Build Docker images only when creating release tags (cost-efficient)
- **deploy.yml**: Manual approval gate for production safety

### Versioning Strategy

**Format:** Semantic versioning with git tags (`v{MAJOR}.{MINOR}.{PATCH}`)

**Examples:**
- Tag: `v0.1.0` → Images: `pokehub.azurecr.io/pokehub-api:v0.1.0`, `pokehub.azurecr.io/pokehub-app:v0.1.0`
- Also tag as `latest` for convenience

**Process:**
1. Developer creates tag: `git tag v0.2.0 && git push origin v0.2.0`
2. `release.yml` triggers automatically, builds images, creates GitHub Release
3. Admin triggers `deploy.yml` manually with version number
4. GitHub Environment "production" requires approval before deployment

## Files to Modify/Create/Delete

### Files to Delete
- `.github/workflows/build-dev.yaml` - Old GitLab-based workflow
- `.github/workflows/build-pr.yaml` - Old PR workflow
- `.github/workflows/build-release.yaml` - Old release workflow

### Files to Create

#### 1. `.github/workflows/ci.yml` - Continuous Integration
**Triggers:** PRs to main, pushes to main

**Jobs:**
- **setup**: Install dependencies, cache node_modules and Nx cache, detect affected projects
- **lint**: `nx affected -t lint --parallel=3`
- **test**: `nx affected -t test --parallel=3 --configuration=ci --coverage`
- **build**: `nx affected -t build --parallel=2 --configuration=production`
- **e2e**: `nx affected -t e2e --parallel=1` (only if apps affected)

**Key Features:**
- Uses `nrwl/nx-set-shas@v4` for affected detection with full git history
- Node.js 20
- Caches: node_modules, Nx computation cache
- Uploads Playwright reports on failure

#### 2. `.github/workflows/release.yml` - Build & Release
**Triggers:** Git tags matching `v*.*.*`, manual workflow_dispatch

**Jobs:**
- **ci-checks**: Run full lint/test/build on all projects
- **build-and-push**: Build Docker images for both apps in parallel (matrix strategy)
  - Use `docker/build-push-action@v5` with Docker buildx
  - Login to ACR with secrets: `ACR_USERNAME`, `ACR_PASSWORD`
  - Tag with version AND `latest`
  - Frontend build arg: `NEXT_PUBLIC_POKEHUB_API_URL=https://api.pokehub.space/api`
  - Cache Docker layers to ACR for faster builds
- **create-release**: Create GitHub Release with auto-generated changelog

**Matrix Strategy:**
```yaml
matrix:
  app:
    - name: pokehub-api
      dockerfile: apps/pokehub-api/Dockerfile
      build-args: ''
    - name: pokehub-app
      dockerfile: apps/pokehub-app/Dockerfile
      build-args: 'NEXT_PUBLIC_POKEHUB_API_URL=https://api.pokehub.space/api'
```

#### 3. `.github/workflows/deploy.yml` - Production Deployment
**Triggers:** Manual workflow_dispatch only

**Inputs:**
- `version`: Version to deploy (e.g., `v0.1.0` or `latest`)
- `app`: Which app to deploy (`api`, `app`, or `both`)

**Jobs:**
- **deploy-api**:
  - Requires GitHub Environment "production" (manual approval)
  - Updates image tag in `pokehub-api.yaml`
  - Creates `.env` file from GitHub Secrets
  - Runs `./deploy.sh pokehub-api`
  - Verifies deployment health with Azure CLI
  - URL: https://api.pokehub.space

- **deploy-app**:
  - Runs after `deploy-api` (sequential dependency)
  - Same process but for frontend
  - URL: https://www.pokehub.space

- **notify**: Post-deployment summary

**Deployment Verification:**
```bash
az containerapp show --name {app} --resource-group pokehub_group \
  --query "properties.runningStatus" -o tsv
# Should return "Running"
```

### Files to Modify

#### 4. `platform/container-apps/pokehub-api.yaml`
**Change:** Update image tag from `dev` to version placeholder
```yaml
# Current (line 28):
image: pokehub.azurecr.io/pokehub-api:dev

# After implementation:
image: pokehub.azurecr.io/pokehub-api:latest
# (workflow will update this to specific version during deployment)
```

#### 5. `platform/container-apps/pokehub-app.yaml`
**Change:** Update image tag from `dev` to version placeholder
```yaml
# Current (line 28):
image: pokehub.azurecr.io/pokehub-app:dev

# After implementation:
image: pokehub.azurecr.io/pokehub-app:latest
# (workflow will update this to specific version during deployment)
```

### Files to Reference (No Changes)
- `platform/container-apps/deploy.sh` - Already perfect, will be used by deploy.yml
- `apps/pokehub-api/Dockerfile` - Backend Dockerfile (no changes needed)
- `apps/pokehub-app/Dockerfile` - Frontend Dockerfile (no changes needed)
- `nx.json` - Already has Nx Cloud token for optimization

## Required GitHub Configuration

### 1. GitHub Secrets (Repository Settings)

Navigate to: **Settings → Secrets and variables → Actions → New repository secret**

```bash
# Azure Authentication
AZURE_CREDENTIALS='{"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}'
# Get this from Azure CLI: az ad sp create-for-rbac --name "github-actions-pokehub" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/pokehub_group --sdk-auth

# Azure Container Registry
ACR_USERNAME=pokehub
ACR_PASSWORD=[Get from Azure Portal: pokehub ACR → Access keys]

# Database
DB_PASSWORD=[Your Supabase password]

# Authentication
NEXTAUTH_SECRET=[Generate: openssl rand -base64 32]
GOOGLE_CLIENT_ID=[From Google Cloud Console]
GOOGLE_CLIENT_SECRET=[From Google Cloud Console]

# JWT Tokens
REFRESH_TOKEN_SECRET=[Generate: openssl rand -base64 32]
ACCESS_TOKEN_SECRET=[Generate: openssl rand -base64 32]

# Azure Storage
AZURE_STORAGE_ACCOUNT_KEY=[From Azure Portal: pokehub storage account]
```

### 2. GitHub Environment

Navigate to: **Settings → Environments → New environment**

**Name:** `production`

**Configuration:**
- ☑ Required reviewers: Add yourself and/or team members
- ☑ Wait timer: 0 minutes (optional: add delay if desired)
- Environment URL: `https://www.pokehub.space`

This creates the manual approval gate for production deployments.

## Implementation Steps

### Phase 1: Setup (Prerequisites)

**Step 1.1: Configure GitHub Secrets**
- Add all 11 secrets listed above to GitHub repository settings
- Verify ACR credentials work: `az acr login --name pokehub`
- Test Azure credentials JSON is valid

**Step 1.2: Create GitHub Environment**
- Create "production" environment with required reviewers
- This enables manual approval for deployments

**Step 1.3: Verify Azure CLI Access**
- Ensure service principal has contributor access to `pokehub_group` resource group
- Test: `az containerapp list --resource-group pokehub_group`

### Phase 2: Create CI Workflow

**Step 2.1: Create `.github/workflows/ci.yml`**
- Copy full workflow definition (see detailed YAML in appendix)
- Key components:
  - Node.js 20, npm ci for dependencies
  - `nrwl/nx-set-shas@v4` with main-branch-name: 'main'
  - Separate jobs for lint, test, build, e2e
  - All jobs use `nx affected` for performance

**Step 2.2: Test CI Workflow**
- Create a test PR with a small change
- Verify workflow runs and shows only affected projects
- Check caching works (subsequent runs should be faster)
- Ensure all jobs pass

### Phase 3: Create Release Workflow

**Step 3.1: Create `.github/workflows/release.yml`**
- Full ci-checks (lint/test/build all projects)
- Matrix build for both apps
- Push to ACR with version tag and `latest` tag
- Create GitHub Release with changelog

**Step 3.2: Test with Test Tag**
- Create test tag: `git tag v0.1.0-test && git push origin v0.1.0-test`
- Monitor workflow execution
- Verify images appear in ACR: `az acr repository show-tags --name pokehub --repository pokehub-api`
- Check both apps built successfully

### Phase 4: Create Deployment Workflow

**Step 4.1: Create `.github/workflows/deploy.yml`**
- Manual workflow_dispatch trigger
- Inputs: version, app selection
- Environment: production (triggers approval)
- Sequential deployment: API first, then App
- Health verification after each deployment

**Step 4.2: Update Container App YAML Files**
```bash
# Update image tags in YAML files to use 'latest' as default
# Workflow will update to specific version during deployment
```

**Step 4.3: Test Deployment Workflow**
- Manually trigger deployment via GitHub Actions UI
- Use version: `v0.1.0-test` (from Phase 3)
- Select app: `both`
- Approve deployment when prompted
- Verify both apps deploy successfully
- Check URLs: https://api.pokehub.space and https://www.pokehub.space

### Phase 5: Cleanup & Documentation

**Step 5.1: Remove Old Workflows**
```bash
git rm .github/workflows/build-dev.yaml
git rm .github/workflows/build-pr.yaml
git rm .github/workflows/build-release.yaml
git commit -m "Remove old GitLab-based CI/CD workflows"
```

**Step 5.2: Remove GitLab Secrets**
- Delete `GITLAB_USERNAME` and `GITLAB_PASSWORD` from GitHub secrets

**Step 5.3: Update Documentation**
- Add CI/CD badges to README.md:
```markdown
![CI](https://github.com/{owner}/PokeHub-App/workflows/Continuous%20Integration/badge.svg)
![Release](https://github.com/{owner}/PokeHub-App/workflows/Release%20%26%20Build%20Images/badge.svg)
```

- Update `platform/container-apps/README.md` with new deployment instructions
- Document the release process in `docs/deployment/`

**Step 5.4: Create First Production Release**
```bash
# Create first official production release
git tag v0.1.0
git push origin v0.1.0

# Wait for release workflow to complete
# Then deploy via GitHub Actions UI
```

## Release Process (Day-to-Day)

### Creating a Release

1. **Ensure main branch is stable**
   - All PRs have passed CI checks
   - Code is tested and reviewed

2. **Create and push version tag**
   ```bash
   git checkout main
   git pull origin main
   git tag v0.2.0  # Increment version appropriately
   git push origin v0.2.0
   ```

3. **Monitor release workflow**
   - GitHub Actions → Release & Build Images workflow
   - Verify CI checks pass
   - Verify Docker images build successfully
   - Check GitHub Release is created with changelog

### Deploying a Release

4. **Trigger deployment workflow**
   - GitHub Actions → Deploy to Azure Container Apps
   - Click "Run workflow"
   - Select version: `v0.2.0`
   - Select app: `both` (or specific app if needed)

5. **Approve deployment**
   - Workflow will pause at approval gate
   - Review changes in GitHub Release notes
   - Click "Review deployments" → "Approve and deploy"

6. **Verify deployment**
   - Workflow shows deployment status
   - Check app URLs:
     - API: https://api.pokehub.space
     - App: https://www.pokehub.space
   - Test critical functionality

### Rollback (If Needed)

If deployment fails or issues are discovered:

**Option 1: Deploy Previous Version**
```bash
# Via GitHub Actions UI
Run workflow: deploy.yml
Version: v0.1.0  # Previous working version
App: both
```

**Option 2: Emergency Rollback via Azure CLI**
```bash
# List revisions
az containerapp revision list \
  --name pokehub-api \
  --resource-group pokehub_group \
  --query "[].{Name:name, Active:properties.active, Created:properties.createdTime}" \
  -o table

# Activate previous revision
az containerapp revision activate \
  --name pokehub-api \
  --resource-group pokehub_group \
  --revision {previous-revision-name}
```

## Optimization & Cost Management

### Nx Affected Optimization
- **Current Setup**: Already using `nx affected` in all workflows
- **Benefit**: Only tests/builds changed code, saving 50-80% of CI time
- **Caching**: Node modules and Nx computation cache reduce build times

### Docker Layer Caching
- **Implementation**: Using Docker buildx with registry cache
- **Cache location**: ACR (pokehub.azurecr.io/{app}:buildcache)
- **Benefit**: Faster image builds (5-10min → 2-3min)

### Nx Cloud (Optional Enhancement)
- **Status**: Already configured (token in nx.json)
- **To Enable**: Uncomment Nx Cloud steps in ci.yml
- **Benefit**: Distributed task execution, shared cache across CI and local dev
- **Cost**: Free tier available, ~$49/month for team plan

### Estimated Monthly Costs
- GitHub Actions: $0 (free tier, ~2000 minutes/month sufficient)
- Azure Container Registry: $5 (Basic tier)
- Nx Cloud: $0 (free tier)
- **Total: ~$5/month**

## Testing Strategy

### Before Going Live

1. **Test CI on Feature Branch**
   - Create PR with changes to multiple packages
   - Verify affected detection works correctly
   - Ensure lint/test/build all pass
   - Check execution time is reasonable

2. **Test Release with Test Tag**
   - Use tag: `v0.1.0-test`
   - Verify images build for both apps
   - Check images are pushed to ACR
   - Validate image tags are correct

3. **Test Deployment in Isolation**
   - Deploy API first with test version
   - Verify health checks work
   - Deploy App with test version
   - Verify both apps are running

4. **Test Rollback**
   - Deploy a different version
   - Verify deployment updates successfully
   - Test emergency rollback via Azure CLI

### Continuous Monitoring

- Monitor GitHub Actions usage (Settings → Billing)
- Check Azure Container Registry storage usage
- Review deployment logs in Azure Portal
- Track application errors in Azure Application Insights

## Security Best Practices

### Secrets Management
✅ All secrets stored in GitHub Secrets (encrypted at rest)
✅ Secrets only accessible to workflows that need them
✅ Secrets passed as environment variables, never logged
✅ .env file created temporarily, never committed to git

### Azure Authentication
✅ Service Principal with minimal required permissions (contributor on resource group only)
✅ Consider upgrading to OIDC (federated identity) for keyless authentication (future enhancement)

### Container Security
✅ Images pulled from private ACR (requires authentication)
✅ Container Apps use secrets for sensitive environment variables
✅ SSL/TLS enabled for all ingress traffic
✅ No privileged containers or root access required

### Dependency Security (Future Enhancement)
- Add Dependabot for automated dependency updates
- Add Snyk or Trivy for vulnerability scanning
- Add CodeQL for static code analysis

## Troubleshooting Guide

### CI Workflow Fails

**Symptom:** Nx affected doesn't detect changes
**Solution:** Ensure `fetch-depth: 0` in checkout step, verify nx-set-shas action runs

**Symptom:** Tests fail in CI but pass locally
**Solution:** Check for environment-specific issues, ensure `--configuration=ci` is used

**Symptom:** E2E tests time out
**Solution:** Increase timeout in Playwright config, ensure services start correctly

### Release Workflow Fails

**Symptom:** Docker build fails with dependency errors
**Solution:** Verify Dockerfile has correct copy commands, check package.json is included

**Symptom:** Cannot push to ACR
**Solution:** Verify ACR_USERNAME and ACR_PASSWORD secrets are correct, check ACR access policies

**Symptom:** Frontend build fails
**Solution:** Ensure NEXT_PUBLIC_POKEHUB_API_URL build arg is provided

### Deployment Workflow Fails

**Symptom:** deploy.sh fails with .env error
**Solution:** Verify all required secrets are configured in GitHub, check .env.template for required vars

**Symptom:** Container app shows "ProvisioningFailed"
**Solution:** Check Azure activity log, verify image tag exists in ACR, check resource limits

**Symptom:** Deployment succeeds but app doesn't start
**Solution:** Check container logs: `az containerapp logs show --name {app} --resource-group pokehub_group --follow`

### General Issues

**Symptom:** Workflow uses too many GitHub Actions minutes
**Solution:** Verify Nx affected is working, check caching is enabled, consider Nx Cloud

**Symptom:** Docker images too large
**Solution:** Review Dockerfile stages, ensure .dockerignore is configured, use Alpine base images

## Success Criteria

After implementation, you should have:

✅ Three GitHub Actions workflows (ci.yml, release.yml, deploy.yml)
✅ All workflows passing and configured correctly
✅ GitHub Environment "production" with required reviewers
✅ All required secrets configured
✅ Old GitLab workflows removed
✅ Container app YAML files updated with versioned image tags
✅ Successful test deployment to production
✅ Documentation updated with new process
✅ Team trained on release and deployment process

## Future Enhancements

### Short Term (Next Quarter)
1. **Staging Environment**: Add a staging Container App for pre-production testing
2. **Automated Rollback**: Automatically rollback on health check failures
3. **Deployment Notifications**: Slack/Discord notifications for deployments
4. **Bundle Size Monitoring**: Fail builds if frontend bundle exceeds threshold

### Medium Term (Next 6 Months)
1. **Nx Cloud Distributed Tasks**: Enable for faster CI on large PRs
2. **Automated Versioning**: Use conventional commits + release-please
3. **Visual Regression Testing**: Integrate Chromatic or Percy
4. **Security Scanning**: Snyk/Trivy for vulnerabilities, CodeQL for static analysis

### Long Term (Next Year)
1. **Multi-Region Deployment**: Deploy to multiple Azure regions for reliability
2. **Canary Deployments**: Gradual rollout with traffic splitting
3. **Infrastructure as Code**: Terraform or Bicep for full Azure infrastructure
4. **Advanced Monitoring**: Full observability with Application Insights, Log Analytics

---

## Critical Files Reference

### Workflows to Create
- `.github/workflows/ci.yml` - Continuous integration with Nx affected
- `.github/workflows/release.yml` - Build and push Docker images
- `.github/workflows/deploy.yml` - Deploy to Azure Container Apps

### Workflows to Delete
- `.github/workflows/build-dev.yaml`
- `.github/workflows/build-pr.yaml`
- `.github/workflows/build-release.yaml`

### Files to Modify
- `platform/container-apps/pokehub-api.yaml` - Update image tag (line 28)
- `platform/container-apps/pokehub-app.yaml` - Update image tag (line 28)

### Files to Reference (No Changes)
- `platform/container-apps/deploy.sh` - Deployment script (works perfectly as-is)
- `apps/pokehub-api/Dockerfile` - Backend Dockerfile
- `apps/pokehub-app/Dockerfile` - Frontend Dockerfile
- `nx.json` - Nx workspace configuration

## Appendix: Complete Workflow Definitions

See the Plan agent's detailed response for full YAML definitions of all three workflows. Key points:

**ci.yml**: Uses nx-set-shas, runs affected commands in parallel, caches aggressively
**release.yml**: Matrix build strategy, pushes to ACR, creates GitHub Release
**deploy.yml**: Manual trigger, environment approval, sequential deployment, health verification
