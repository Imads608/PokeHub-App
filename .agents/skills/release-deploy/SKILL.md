---
name: release-deploy
description: Ship a PokeHub release to production — tag a version to build Docker images (release.yml), then run the manual deploy workflow (deploy.yml) that migrates the DB and rolls out the Azure Container Apps. Use when the user wants to cut a release, deploy a version, roll back, or troubleshoot the release/deploy pipeline.
---

# Release & Deploy (PokeHub)

PokeHub ships in **two deliberate steps**: tagging builds images, and a **separate manual** workflow
deploys them. Tagging never deploys on its own.

**Source of truth — read these, don't duplicate them:**
- [`docs/deployment/release-and-deploy.md`](../../../docs/deployment/release-and-deploy.md) — the full runbook.
- [`docs/deployment/ci-cd-workflows.md`](../../../docs/deployment/ci-cd-workflows.md) — per-workflow detail + required secrets.
- [`docs/deployment/database.md`](../../../docs/deployment/database.md) — production DB + credential sync.
- [`docs/deployment/container-apps/troubleshooting.md`](../../../docs/deployment/container-apps/troubleshooting.md) — crash-loops, DB/Redis.
- Workflows: [`.github/workflows/release.yml`](../../../.github/workflows/release.yml), [`.github/workflows/deploy.yml`](../../../.github/workflows/deploy.yml).

## Step 1 — Cut a release (auto on tag)

```bash
git checkout main && git pull
git tag vX.Y.Z            # semantic version; must match v*.*.*
git push origin vX.Y.Z
```

`release.yml` runs CI checks → builds & pushes **both** images to `pokehub.azurecr.io` (tagged
`vX.Y.Z` **and** `latest`) → creates a GitHub Release. Watch and verify:

```bash
gh run list --workflow "Release & Build Images" --limit 3
az acr repository show-tags --name pokehub --repository pokehub-api --output table
```

If the build fails and you fix `main`, move the tag and force-push to re-trigger:
```bash
git tag -f vX.Y.Z <new-sha> && git push origin vX.Y.Z --force
```

## Step 2 — Deploy (manual)

`deploy.yml` is `workflow_dispatch`, gated by the GitHub `production` environment. It runs DB
migrations, then deploys API and App.

```bash
gh workflow run "Deploy to Azure Container Apps" -f version=vX.Y.Z -f app=both   # or api / app
gh run watch <run-id>
```

Verify:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api.pokehub.space/api/health   # expect 200
az containerapp revision list --name pokehub-api --resource-group pokehub_group \
  --query "[?properties.active].{name:name,running:properties.runningState,health:properties.healthState}" -o table
```

## Rollback

Deploy an older, schema-compatible tag (images are retained per version in ACR):
```bash
gh workflow run "Deploy to Azure Container Apps" -f version=vX.Y.(Z-1) -f app=both
```
Migrations are **not** auto-reversed — only roll back to a version compatible with the current schema.

## Critical rules

- **`deploy.yml` reads config from GitHub secrets, every run** — not from the live Container App. If
  the database, Redis, or any secret changed, update the GitHub secrets **first**, or the deploy
  reverts production to the old value. Sync procedure:
  [database.md](../../../docs/deployment/database.md#keeping-credentials-in-sync--read-this).
- **The Container App manifest is authoritative.** `deploy.sh` applies the whole
  `platform/container-apps/*.yaml`, including env-var → secret mappings. Setting a secret alone
  won't help if the deployed revision doesn't map it — always redeploy the current manifest.
- **Commit generated Drizzle migrations.** `deploy.yml` runs `drizzle-kit migrate` before deploying
  the API; uncommitted migrations won't be applied. See the
  [`db-migrate`](../db-migrate/SKILL.md) skill.
- **Docker builds need `tools/`.** `nx.json` registers `@pokehub/workspace-plugin` from
  `tools/workspace-plugin`; both Dockerfiles copy `tools/` and it must stay out of `.dockerignore`,
  or image builds fail with `NX Cannot find module '/app'`.

## Manual deploy (no CI)

From `platform/container-apps/` with a populated `.env` (gitignored):
```bash
./deploy.sh pokehub-api      # or pokehub-app
```
Details: [container-apps/operations.md](../../../docs/deployment/container-apps/operations.md).

## When a deploy fails to boot

Check logs and follow the runbook's failure modes — most often a DB connection error, a Redis
connection error (fast-fail), or a crash-loop masking a second dependency:
```bash
az containerapp logs show --name pokehub-api --resource-group pokehub_group --type console --tail 50
```
See [troubleshooting.md](../../../docs/deployment/container-apps/troubleshooting.md).
