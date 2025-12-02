# Next.js Standalone Deployment Troubleshooting Guide

**Date**: December 1, 2025
**Application**: PokeHub Frontend (Next.js 14 + Nx Monorepo)
**Platform**: Azure Container Apps
**Issue**: Static files and public assets returning 404 after deployment
**Status**: ✅ Resolved

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Issue 1: Static Files Returning 404](#issue-1-static-files-returning-404)
   - [Problem](#problem)
   - [Root Cause](#root-cause)
   - [Discovery Process](#discovery-process)
   - [Why This Path Works](#why-this-path-works)
   - [Solution](#solution)
3. [Issue 2: Public Files Returning 404](#issue-2-public-files-returning-404)
   - [Problem](#problem-1)
   - [Root Cause](#root-cause-1)
   - [Discovery Process](#discovery-process-1)
   - [Solution](#solution-1)
4. [Issue 3: Azure Container Apps Image Tag Caching](#issue-3-azure-container-apps-image-tag-caching)
   - [Problem](#problem-2)
   - [Root Cause](#root-cause-2)
   - [Timeline](#timeline)
   - [Discovery Process](#discovery-process-2)
   - [Solution](#solution-2)
   - [Why This Worked](#why-this-worked)
   - [Commands That Did NOT Work](#commands-that-did-not-work)
5. [Final Working Configuration](#final-working-configuration)
   - [Dockerfile Structure](#dockerfile-structure)
   - [Runtime File Structure](#runtime-file-structure)
   - [Path Resolution](#path-resolution)
6. [Deployment Commands](#deployment-commands)
   - [Build Image](#build-image)
   - [Deploy New Image](#deploy-new-image-recommended)
   - [Alternative: Use Immutable Tags](#alternative-use-immutable-tags)
7. [Testing & Verification](#testing--verification)
   - [Local Testing](#local-testing-before-deployment)
   - [Production Testing](#production-testing-after-deployment)
   - [Verify Deployment](#verify-deployment)
8. [Key Learnings](#key-learnings)
   - [1. Next.js Standalone Paths in Nx Monorepos](#1-nextjs-standalone-paths-in-nx-monorepos)
   - [2. Azure Container Apps Image Management](#2-azure-container-apps-image-management)
   - [3. Debugging Strategy](#3-debugging-strategy)
   - [4. Docker Multi-stage Build Best Practices](#4-docker-multi-stage-build-best-practices)
9. [Common Pitfalls](#common-pitfalls)
10. [Verified Working Endpoints](#verified-working-endpoints)
11. [Future Improvements](#future-improvements)
12. [References](#references)
13. [Appendix: Complete Session Timeline](#appendix-complete-session-timeline)

---

## Executive Summary

After deploying the Next.js frontend to Azure Container Apps, all static assets (JS/CSS files) and public files (favicon, images) were returning 404 errors. The root causes were:

1. **Public folder path misconfiguration** in Dockerfile
2. **Azure Container Apps image caching** preventing deployment of fixed image
3. Static files path was actually correct, but appeared broken due to caching

**Time to Resolution**: ~2 hours
**Key Fix**: Corrected public folder path + forced fresh image deployment

---

## Issue 1: Static Files Returning 404

### Problem
JavaScript and CSS files at `/_next/static/chunks/*.js` returning 404 errors:
```
GET https://www.pokehub.space/_next/static/chunks/webpack-b5c295bbea10b3f6.js
→ HTTP 404 Not Found
```

### Root Cause
**This was a red herring** - the Dockerfile configuration was actually correct:

```dockerfile
COPY --from=builder /app/dist/apps/pokehub-app/.next/static ./dist/apps/pokehub-app/.next/static
```

The issue was that Azure Container Apps was serving a cached, older image that didn't have the files properly configured. Even after fixing the Dockerfile, the cached image continued to be used.

### Discovery Process

1. **Initial Suspicion**: Dockerfile path was wrong
   ```bash
   # Tested locally
   cd dist/apps/pokehub-app/.next/standalone
   node apps/pokehub-app/server.js
   curl -I http://localhost:3000/_next/static/chunks/webpack-b5c295bbea10b3f6.js
   → HTTP 404
   ```

2. **Manual File Placement**: Manually copied static files to verify correct location
   ```bash
   cp -r dist/apps/pokehub-app/.next/static \
         dist/apps/pokehub-app/.next/standalone/dist/apps/pokehub-app/.next/
   # Restarted server
   curl -I http://localhost:3000/_next/static/chunks/webpack-b5c295bbea10b3f6.js
   → HTTP 200 ✓
   ```

3. **Verified Source Path**: Confirmed files exist at source location
   ```bash
   find dist/apps/pokehub-app -name "webpack-*.js" -type f
   → /home/imads608/Work/PokeHub-App/dist/apps/pokehub-app/.next/static/chunks/webpack-b5c295bbea10b3f6.js
   ```

4. **Checked Dockerfile**: Dockerfile was already copying from correct location
   ```dockerfile
   COPY --from=builder /app/dist/apps/pokehub-app/.next/static ./dist/apps/pokehub-app/.next/static
   ```

5. **Realized**: The issue was deployment caching, not the Dockerfile itself

### Why This Path Works

The Next.js standalone build creates a `required-server-files.json` that specifies:
```json
{
  "config": {
    "distDir": "../../dist/apps/pokehub-app/.next"
  }
}
```

From the server location at `standalone/apps/pokehub-app/server.js`:
- Go up 2 directories: `../../` → `standalone/`
- Navigate to: `dist/apps/pokehub-app/.next/`
- Find static files at: `standalone/dist/apps/pokehub-app/.next/static/`

### Solution
The static files path was always correct. The actual fix required resolving the deployment caching issue (see Issue 3).

---

## Issue 2: Public Files Returning 404

### Problem
Public assets (favicon, images) returning 404 errors:
```
GET https://www.pokehub.space/favicon.ico
→ HTTP 404 Not Found
```

### Root Cause
Dockerfile was copying public folder to wrong location. The files were being placed in the `dist/` directory instead of alongside the `server.js` file:

```dockerfile
# WRONG - copied to dist directory
COPY --from=builder /app/dist/apps/pokehub-app/public ./dist/apps/pokehub-app/public
```

**Why This Failed**:
- Server runs from: `/app/apps/pokehub-app/server.js`
- Next.js looks for public at: `/app/apps/pokehub-app/public`
- But files were at: `/app/dist/apps/pokehub-app/public` ❌

### Discovery Process

1. **Local Testing**: Ran standalone server locally
   ```bash
   cd dist/apps/pokehub-app/.next/standalone
   NEXT_PUBLIC_POKEHUB_API_URL=https://api.pokehub.space node apps/pokehub-app/server.js
   curl -I http://localhost:3000/favicon.ico
   → HTTP 404
   ```

2. **Attempted Fix #1**: Copy to standalone root
   ```bash
   cp -r dist/apps/pokehub-app/public \
         dist/apps/pokehub-app/.next/standalone/public/
   # Restarted server
   curl -I http://localhost:3000/favicon.ico
   → HTTP 404 ✗
   ```

3. **Attempted Fix #2**: Copy to dist directory
   ```bash
   cp -r dist/apps/pokehub-app/public \
         dist/apps/pokehub-app/.next/standalone/dist/apps/pokehub-app/public/
   # Restarted server
   curl -I http://localhost:3000/favicon.ico
   → HTTP 404 ✗
   ```

4. **Successful Fix**: Copy alongside server.js
   ```bash
   cp -r dist/apps/pokehub-app/public \
         dist/apps/pokehub-app/.next/standalone/apps/pokehub-app/public/
   # Restarted server
   curl -I http://localhost:3000/favicon.ico
   → HTTP 200 ✓
   ```

### Solution

**File**: `apps/pokehub-app/Dockerfile:38`

Changed from:
```dockerfile
COPY --from=builder /app/dist/apps/pokehub-app/public ./dist/apps/pokehub-app/public
```

To:
```dockerfile
COPY --from=builder /app/dist/apps/pokehub-app/public ./apps/pokehub-app/public
```

**Git Diff**:
```diff
  # Copy static files to where Next.js expects them in the standalone structure
  COPY --from=builder /app/dist/apps/pokehub-app/.next/static ./dist/apps/pokehub-app/.next/static
- COPY --from=builder /app/dist/apps/pokehub-app/public ./dist/apps/pokehub-app/public
+ COPY --from=builder /app/dist/apps/pokehub-app/public ./apps/pokehub-app/public
```

---

## Issue 3: Azure Container Apps Image Tag Caching

### Problem
After fixing the Dockerfile and rebuilding the image, files **still** returned 404 in production:
```bash
# Fixed Dockerfile
# Built new image
az acr build --registry pokehub --image pokehub-app:dev ...
# Deployed new revision
az containerapp revision copy --name pokehub-app ...
# Test in production
curl -I https://www.pokehub.space/_next/static/chunks/webpack-b5c295bbea10b3f6.js
→ HTTP 404 ✗ (Still broken!)
```

### Root Cause

**Azure Container Apps was using a cached, old image**:
- Using mutable `:dev` image tag
- Original revision created at 07:19 UTC with buggy Dockerfile
- Fixed Dockerfile and rebuilt image at 17:03 UTC (10 hours later)
- `az containerapp revision copy` didn't force a fresh image pull
- Container was still using the 07:19 UTC image

### Timeline

```
07:19 UTC - Original revision created (public path bug)
          - Image: pokehub.azurecr.io/pokehub-app:dev

17:03 UTC - Fixed Dockerfile, rebuilt image
          - Image: pokehub.azurecr.io/pokehub-app:dev (same tag!)

17:56 UTC - Deployed with revision copy
          → Still using cached 07:19 image ❌

17:59 UTC - Tried revision restart
          → Still using cached image ❌

18:00 UTC - Used update with timestamp suffix
          → Pulled fresh image ✓
```

### Discovery Process

1. **Verified Dockerfile**: Confirmed both static and public paths were correct

2. **Checked Revision Details**:
   ```bash
   az containerapp revision show \
     --name pokehub-app \
     --resource-group pokehub_group \
     --revision pokehub-app--svs9d1q \
     --query "{created: properties.createdTime, image: properties.template.containers[0].image}"
   ```

   Result:
   ```json
   {
     "created": "2025-12-01T07:19:52+00:00",
     "image": "pokehub.azurecr.io/pokehub-app:dev"
   }
   ```

3. **Realization**: Revision created 10 hours before the new build!

### Solution

Force fresh deployment with unique revision suffix:

```bash
az containerapp update \
  --name pokehub-app \
  --resource-group pokehub_group \
  --image pokehub.azurecr.io/pokehub-app:dev \
  --revision-suffix "$(date +%s)"
```

**Result**:
```bash
# New revision created: pokehub-app--1764612031
# Waited 15 seconds for deployment
curl -I https://www.pokehub.space/_next/static/chunks/webpack-b5c295bbea10b3f6.js
→ HTTP 200 ✓

curl -I https://www.pokehub.space/favicon.ico
→ HTTP 200 ✓
```

### Why This Worked

- `az containerapp update` with `--revision-suffix` creates a **new revision**
- New revision forces a fresh image pull from ACR
- The timestamp suffix ensures a unique revision name
- Azure Container Apps pulls the latest `:dev` tag instead of using cache

### Commands That Did NOT Work

```bash
# ❌ Does not force fresh pull
az containerapp revision copy --name pokehub-app --resource-group pokehub_group

# ❌ Restarts existing container, doesn't pull new image
az containerapp revision restart --name pokehub-app --resource-group pokehub_group
```

---

## Final Working Configuration

### Dockerfile Structure
**File**: `apps/pokehub-app/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Copy config files needed for lint, test, and build
COPY .eslintrc.json jest.preset.js jest.config.ts tailwind.config.js ./

# Copy all source code
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN npm install

# Build arguments for Next.js
ARG NEXT_PUBLIC_POKEHUB_API_URL
ENV NEXT_PUBLIC_POKEHUB_API_URL=${NEXT_PUBLIC_POKEHUB_API_URL}
ENV POKEHUB_API_URL=${NEXT_PUBLIC_POKEHUB_API_URL}

# Build the app
RUN npx nx build pokehub-app --configuration=production

# Runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy standalone output (minimal dependencies traced by Next.js)
COPY --from=builder /app/dist/apps/pokehub-app/.next/standalone ./

# Copy static files to where Next.js expects them in the standalone structure
COPY --from=builder /app/dist/apps/pokehub-app/.next/static ./dist/apps/pokehub-app/.next/static
COPY --from=builder /app/dist/apps/pokehub-app/public ./apps/pokehub-app/public

EXPOSE 3000

# Start the standalone server
CMD ["node", "apps/pokehub-app/server.js"]
```

### Runtime File Structure

```
/app/                                          # Docker WORKDIR
├── apps/pokehub-app/
│   ├── server.js                             # Server entry point
│   └── public/                               # ✅ Public files (favicon, images)
│       ├── favicon.ico
│       └── ...
├── dist/apps/pokehub-app/.next/
│   ├── static/                               # ✅ Static files (JS, CSS chunks)
│   │   ├── chunks/
│   │   │   ├── webpack-b5c295bbea10b3f6.js
│   │   │   └── ...
│   │   └── css/
│   ├── server/                               # Server-side bundles
│   │   ├── app/
│   │   └── webpack-runtime.js
│   ├── app-build-manifest.json
│   ├── build-manifest.json
│   ├── required-server-files.json           # Contains distDir config
│   └── ...
├── node_modules/                             # Traced dependencies only
├── package.json
└── ...
```

### Path Resolution

**Server Location**: `/app/apps/pokehub-app/server.js`

**Static Files** (`/_next/static/*`):
1. Server reads `distDir` from `required-server-files.json`: `"../../dist/apps/pokehub-app/.next"`
2. From server location: `apps/pokehub-app/server.js`
3. Navigate: `../../` → `/app/`
4. Then to: `dist/apps/pokehub-app/.next/`
5. Final path: `/app/dist/apps/pokehub-app/.next/static/` ✓

**Public Files** (`/favicon.ico`, `/images/*`):
1. Next.js looks for public directory alongside server
2. Server location: `/app/apps/pokehub-app/server.js`
3. Public location: `/app/apps/pokehub-app/public/` ✓

---

## Deployment Commands

### Build Image
```bash
az acr build \
  --registry pokehub \
  --image pokehub-app:dev \
  --file apps/pokehub-app/Dockerfile \
  --build-arg NEXT_PUBLIC_POKEHUB_API_URL=https://api.pokehub.space \
  .
```

### Deploy New Image (Recommended)
```bash
# Use timestamp suffix to force fresh pull
az containerapp update \
  --name pokehub-app \
  --resource-group pokehub_group \
  --image pokehub.azurecr.io/pokehub-app:dev \
  --revision-suffix "$(date +%s)"
```

### Alternative: Use Immutable Tags
```bash
# Build with commit SHA
COMMIT_SHA=$(git rev-parse --short HEAD)
az acr build \
  --registry pokehub \
  --image pokehub-app:${COMMIT_SHA} \
  --file apps/pokehub-app/Dockerfile \
  --build-arg NEXT_PUBLIC_POKEHUB_API_URL=https://api.pokehub.space \
  .

# Deploy specific version
az containerapp update \
  --name pokehub-app \
  --resource-group pokehub_group \
  --image pokehub.azurecr.io/pokehub-app:${COMMIT_SHA}
```

---

## Testing & Verification

### Local Testing (Before Deployment)
```bash
# Build locally
nx build pokehub-app --configuration=production

# Navigate to standalone output
cd dist/apps/pokehub-app/.next/standalone

# Set environment variables
export NEXT_PUBLIC_POKEHUB_API_URL=https://api.pokehub.space

# Start server
node apps/pokehub-app/server.js

# Test in another terminal
curl -I http://localhost:3000/                                                  # Homepage
curl -I http://localhost:3000/_next/static/chunks/webpack-b5c295bbea10b3f6.js  # Static file
curl -I http://localhost:3000/favicon.ico                                       # Public file
```

### Production Testing (After Deployment)
```bash
# Wait for deployment to complete (30-60 seconds)
sleep 30

# Test homepage
curl -I https://www.pokehub.space/

# Test static files
curl -I https://www.pokehub.space/_next/static/chunks/webpack-b5c295bbea10b3f6.js

# Test public files
curl -I https://www.pokehub.space/favicon.ico

# Extract and test multiple static files
curl -s https://www.pokehub.space/ | grep -o '/_next/static/[^"]*\.js' | head -5 | while read file; do
  echo "Testing: $file"
  curl -I "https://www.pokehub.space$file" | head -1
done
```

### Verify Deployment
```bash
# Check current revision
az containerapp show \
  --name pokehub-app \
  --resource-group pokehub_group \
  --query "{latestRevision: properties.latestRevisionName, status: properties.runningStatus}"

# Check revision details
az containerapp revision show \
  --name pokehub-app \
  --resource-group pokehub_group \
  --revision <revision-name> \
  --query "{created: properties.createdTime, image: properties.template.containers[0].image}"

# View logs
az containerapp logs show \
  --name pokehub-app \
  --resource-group pokehub_group \
  --tail 50 \
  --follow false
```

---

## Key Learnings

### 1. Next.js Standalone Paths in Nx Monorepos

**Static Files** (`/_next/static/*`):
- Location: `standalone/dist/[workspace-path]/.next/static/`
- Follows the `distDir` configuration in `required-server-files.json`
- Path is relative to server.js location

**Public Files** (`/public/*`):
- Location: `standalone/apps/[app-name]/public/`
- Must be alongside `server.js`
- Not configurable via distDir

**Critical File**: Always check `required-server-files.json` for distDir:
```bash
cat dist/apps/pokehub-app/.next/standalone/dist/apps/pokehub-app/.next/required-server-files.json | jq '.config.distDir'
```

### 2. Azure Container Apps Image Management

**Problem with Mutable Tags**:
- Tags like `:dev`, `:latest` are cached aggressively
- Updates to same tag don't automatically trigger pulls
- Can lead to deploying old images even after rebuild

**Solutions**:

a) **Use revision suffix** (Quick fix for mutable tags):
```bash
az containerapp update \
  --name pokehub-app \
  --resource-group pokehub_group \
  --image pokehub.azurecr.io/pokehub-app:dev \
  --revision-suffix "$(date +%s)"
```

b) **Use immutable tags** (Best practice):
```bash
# Git commit SHA
--image pokehub.azurecr.io/pokehub-app:$(git rev-parse --short HEAD)

# Build number
--image pokehub.azurecr.io/pokehub-app:build-${BUILD_NUMBER}

# Semantic version
--image pokehub.azurecr.io/pokehub-app:v1.2.3
```

**Commands Comparison**:

| Command | Forces New Image Pull? | Use Case |
|---------|----------------------|----------|
| `az containerapp revision copy` | ❌ No | Copy existing revision with changes |
| `az containerapp revision restart` | ❌ No | Restart failed/stopped revision |
| `az containerapp update` | ✅ Yes (with unique suffix) | Deploy new image version |

### 3. Debugging Strategy

**Step-by-step approach**:

1. **Test Locally First**
   ```bash
   cd dist/apps/[app]/.next/standalone
   node apps/[app]/server.js
   ```

2. **Verify File Locations**
   ```bash
   find standalone -name "favicon.ico"
   find standalone -name "webpack-*.js"
   ```

3. **Check Configuration Files**
   ```bash
   cat standalone/dist/apps/[app]/.next/required-server-files.json | jq '.config.distDir'
   ```

4. **Test Individual Assets**
   ```bash
   curl -I http://localhost:3000/_next/static/chunks/[file]
   curl -I http://localhost:3000/favicon.ico
   ```

5. **Verify Deployment Timing**
   ```bash
   # Check when image was built
   az acr repository show-tags --name pokehub --repository pokehub-app --detail

   # Check when revision was created
   az containerapp revision show --name pokehub-app --resource-group pokehub_group --revision [name] --query "properties.createdTime"
   ```

### 4. Docker Multi-stage Build Best Practices

**Verify Source Paths**:
```dockerfile
# Use ls to verify files exist before copying
RUN ls -la /app/dist/apps/pokehub-app/.next/static/
RUN ls -la /app/dist/apps/pokehub-app/public/

# Then copy
COPY --from=builder /app/dist/apps/pokehub-app/.next/static ./dist/apps/pokehub-app/.next/static
COPY --from=builder /app/dist/apps/pokehub-app/public ./apps/pokehub-app/public
```

**Use Build Progress**:
```bash
# See detailed copy operations
docker build --progress=plain -f apps/pokehub-app/Dockerfile .
```

**Test Image Locally**:
```bash
# Build image
docker build -t pokehub-app:test -f apps/pokehub-app/Dockerfile .

# Run container
docker run -p 3000:3000 -e NEXT_PUBLIC_POKEHUB_API_URL=https://api.pokehub.space pokehub-app:test

# Test in another terminal
curl -I http://localhost:3000/_next/static/chunks/webpack-*.js
curl -I http://localhost:3000/favicon.ico

# Inspect file structure
docker run --rm -it pokehub-app:test sh
# Inside container:
ls -la /app/apps/pokehub-app/public/
ls -la /app/dist/apps/pokehub-app/.next/static/
```

---

## Common Pitfalls

### ❌ Pitfall 1: Assuming Dockerfile Paths Work Without Testing
```dockerfile
# Looks correct, but may not match Next.js expectations
COPY --from=builder /app/dist/apps/pokehub-app/public ./dist/apps/pokehub-app/public
```

**Solution**: Always test standalone build locally first

### ❌ Pitfall 2: Using revision copy for New Images
```bash
# This doesn't pull new images!
az containerapp revision copy --name pokehub-app --resource-group pokehub_group
```

**Solution**: Use `az containerapp update` with revision suffix

### ❌ Pitfall 3: Relying on Mutable Tags
```bash
# Same tag = cached image
az acr build --image pokehub-app:dev
az acr build --image pokehub-app:dev  # Same tag!
```

**Solution**: Use immutable tags (commit SHA, build number)

### ❌ Pitfall 4: Not Checking Deployment Timestamps
```bash
# Image built at 17:03, but revision created at 07:19
# → Using old image!
```

**Solution**: Always verify revision creation time vs. build time

---

## Verified Working Endpoints

### Production URLs
- ✅ Homepage: https://www.pokehub.space/
- ✅ Static JS: https://www.pokehub.space/_next/static/chunks/webpack-b5c295bbea10b3f6.js
- ✅ Static CSS: https://www.pokehub.space/_next/static/css/[hash].css
- ✅ Favicon: https://www.pokehub.space/favicon.ico
- ✅ API Backend: https://api.pokehub.space/

### HTTP Response Headers (Success)
```
HTTP/2 200
cache-control: public, max-age=31536000, immutable
content-type: application/javascript; charset=UTF-8
```

---

## Future Improvements

### 1. Implement Immutable Image Tags
```bash
# .github/workflows/deploy.yml
- name: Build and Push
  run: |
    COMMIT_SHA=$(git rev-parse --short HEAD)
    az acr build \
      --registry pokehub \
      --image pokehub-app:${COMMIT_SHA} \
      --image pokehub-app:latest \
      --file apps/pokehub-app/Dockerfile \
      .
```

### 2. Add Dockerfile Validation
```bash
# Validate files exist before deploy
docker build --target builder -t pokehub-app:builder .
docker run --rm pokehub-app:builder sh -c "ls /app/dist/apps/pokehub-app/.next/static/"
docker run --rm pokehub-app:builder sh -c "ls /app/dist/apps/pokehub-app/public/"
```

### 3. Add Smoke Tests to Deployment
```bash
# After deployment, verify critical assets
ENDPOINTS=(
  "/"
  "/_next/static/chunks/webpack-*.js"
  "/favicon.ico"
)

for endpoint in "${ENDPOINTS[@]}"; do
  STATUS=$(curl -o /dev/null -s -w "%{http_code}" "https://www.pokehub.space${endpoint}")
  if [ "$STATUS" != "200" ]; then
    echo "❌ Failed: ${endpoint} returned ${STATUS}"
    exit 1
  fi
done
```

### 4. Consider CDN for Static Assets
- Offload `/_next/static/*` to Azure CDN
- Improve global performance
- Reduce container load

---

## References

- [Next.js Standalone Mode Documentation](https://nextjs.org/docs/pages/api-reference/next-config-js/output#automatically-copying-traced-files)
- [Nx Next.js Configuration](https://nx.dev/recipes/next/next-config-setup)
- [Azure Container Apps Revisions](https://learn.microsoft.com/en-us/azure/container-apps/revisions)
- [Azure Container Registry Best Practices](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-best-practices)

---

## Appendix: Complete Session Timeline

```
Session Start
├─ Initial State: Frontend deployed but 404s on all assets
│
├─ 00:00 - Identified public folder path issue
│  └─ Fixed: apps/pokehub-app/Dockerfile:38
│
├─ 00:15 - Built new image with fix
│  └─ az acr build completed successfully
│
├─ 00:20 - Deployed with revision copy
│  └─ Still getting 404s!
│
├─ 00:25 - Local testing to isolate issue
│  ├─ Static files worked locally
│  └─ Public files worked locally
│
├─ 00:40 - Discovered deployment caching
│  ├─ Checked revision creation time
│  └─ Found 10-hour gap between build and revision
│
├─ 00:45 - Attempted revision restart
│  └─ Still using cached image
│
├─ 00:50 - Used az containerapp update with timestamp suffix
│  └─ ✅ Success! All assets returning 200
│
└─ 01:00 - Verified all endpoints working
   └─ Session Complete
```

---

**Document Version**: 1.0
**Last Updated**: December 1, 2025
**Author**: Deployment Troubleshooting Session
**Status**: ✅ Resolved
