# CI/CD Workflows

This document describes the GitHub Actions workflows used for continuous integration and deployment of the PokeHub application.

## Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR to main, push to main | Quality gates (lint, test, build, e2e) |
| `release.yml` | Tags matching `v*.*.*` | Build and push Docker images to ACR |
| `deploy.yml` | Manual (workflow_dispatch) | Deploy to Azure Container Apps |

## Workflow Details

### CI Workflow (`ci.yml`)

Runs on every pull request and push to `main`. Uses Nx affected commands to only run checks on changed projects.

**Jobs:**
1. **Setup & Detect Changes** - Identifies which apps are affected by the changes
2. **Lint** - ESLint checks on affected projects
3. **Test** - Jest unit tests with coverage reporting
4. **Build** - Production builds of affected projects
5. **E2E** - Playwright tests across Chromium, Firefox, and WebKit

**Key Design Decisions:**

- **Nx Affected Commands**: Only runs tasks on projects affected by the changes, significantly reducing CI time for small changes.

- **`npm ci` in Every Job**: Each GitHub Actions job runs on a separate virtual machine with no shared filesystem. While we cache `node_modules`, we still run `npm ci` as a safety net. The cache makes this fast when `package-lock.json` hasn't changed. An alternative would be to skip `npm ci` on cache hits, but the current approach is more reliable.

- **`NX_NO_CLOUD: true`**: Disables Nx Cloud to avoid authorization issues in CI. The workspace would need to be claimed within 3 days of the first CI run otherwise.

- **PostgreSQL Service Container**: The e2e job spins up a PostgreSQL container for API integration tests. This provides an isolated, reproducible database environment.

- **Environment Variables for E2E**: The app requires `NEXT_PUBLIC_POKEHUB_API_URL` at runtime. Without it, `new URL(undefined)` throws an error in the bootstrapper, causing "Unhandled Runtime Error". We set this and other required env vars (`AUTH_SECRET`, `AUTH_TRUST_HOST`) in the e2e job.

- **Playwright Trace on CI**: Traces are enabled for all tests in CI (`trace: 'on'`) to help debug failures. Locally, traces are only captured on first retry to save resources.

- **Concurrency Control**: Uses `cancel-in-progress: true` to cancel outdated runs when new commits are pushed to the same PR.

### Release Workflow (`release.yml`)

Triggered when a semantic version tag (e.g., `v1.0.0`) is pushed.

**What it does:**
1. Builds Docker images for both `pokehub-api` and `pokehub-app`
2. Pushes images to Azure Container Registry with both the version tag and `latest`

**Key Design Decisions:**

- **Matrix Build**: Builds both apps in parallel using a matrix strategy for efficiency.

- **Version Tagging**: Each image is tagged with both the specific version (e.g., `v1.0.0`) and `latest`. The version tag enables rollbacks; `latest` simplifies deployment configs.

- **`NEXT_PUBLIC_POKEHUB_API_URL` Build Arg**: The Next.js app needs the API URL at build time since it's baked into the client bundle. This is passed as a Docker build argument.

### Deploy Workflow (`deploy.yml`)

Manually triggered to deploy to production.

**Inputs:**
- `version`: The version tag to deploy (default: `latest`)
- `deploy_api`: Whether to deploy the API (default: true)
- `deploy_app`: Whether to deploy the App (default: true)

**Key Design Decisions:**

- **Manual Trigger**: Deployments are intentional, not automatic. This provides a checkpoint before production changes.

- **Environment Protection**: Uses GitHub's `production` environment which can be configured with required reviewers, adding an approval step before deployment.

- **Sequential Deployment**: Deploys API first, then App. This ensures the API is available when the App starts, preventing connection errors during rollout.

- **Azure CLI Deployment**: Uses `az containerapp update` to update the running container apps with new image versions.

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `ACR_REGISTRY` | Azure Container Registry URL (e.g., `myregistry.azurecr.io`) |
| `ACR_USERNAME` | ACR username for pushing images |
| `ACR_PASSWORD` | ACR password for pushing images |
| `AZURE_CREDENTIALS` | Azure service principal credentials (JSON) for deployment |
| `AZURE_RESOURCE_GROUP` | Azure resource group containing the Container Apps |

## GitHub Environment

Create a `production` environment in repository settings with:
- Required reviewers (optional but recommended)
- Environment URL: `https://pokehub.space` (for visibility in GitHub UI)

## Usage

### Running CI
CI runs automatically on PRs and pushes to main. No manual action needed.

### Creating a Release
```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

This triggers the release workflow to build and push Docker images.

### Deploying to Production
1. Go to Actions > "Deploy to Production"
2. Click "Run workflow"
3. Enter the version to deploy (or leave as `latest`)
4. Select which apps to deploy
5. Click "Run workflow"
6. Approve the deployment if environment protection is enabled

## Troubleshooting

### E2E Tests Show "Unhandled Runtime Error"
Missing `NEXT_PUBLIC_POKEHUB_API_URL`. Ensure it's set in the e2e job's env section.

### Nx Cloud Authorization Error
Set `NX_NO_CLOUD: true` in the workflow env to disable Nx Cloud.

### Docker Image Pull Failures
If Docker Hub has issues, the PostgreSQL service container may fail to start. We use `postgres:15-alpine` which is generally reliable.

### Playwright Artifacts Not Uploading
Ensure the artifact path matches where Nx Playwright preset outputs files: `dist/.playwright/`
