# Release & Deploy Runbook

How a change on `main` becomes a running production deployment. This is the source of truth for
shipping PokeHub; the [`release-deploy`](../../.agents/skills/release-deploy/SKILL.md) skill is the
step-by-step companion an agent can execute.

## The pipeline at a glance

Two GitHub Actions workflows, triggered in **two separate steps**. Tagging does **not** deploy on
its own — deployment is a deliberate, manually-triggered step with an approval gate.

```
 git tag vX.Y.Z ──▶ release.yml (auto, on tag push)
                     ├─ CI Checks (lint · test · build)
                     ├─ Build & Push images  ──▶ pokehub.azurecr.io/{pokehub-api,pokehub-app}:vX.Y.Z + :latest
                     └─ Create GitHub Release (changelog)

        (manual) ──▶ deploy.yml (workflow_dispatch: version + app)
                     ├─ Run DB migrations (drizzle-kit migrate, from GitHub DB_* secrets)
                     ├─ Deploy API  (az containerapp update via deploy.sh)  ──▶ api.pokehub.space
                     └─ Deploy App  (az containerapp update via deploy.sh)  ──▶ www.pokehub.space
```

Workflow files: [`.github/workflows/release.yml`](../../.github/workflows/release.yml) and
[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml). Design rationale and the full
secrets list live in [ci-cd-workflows.md](./ci-cd-workflows.md).

## Step 1 — Cut a release (build images)

`release.yml` triggers automatically on any tag matching `v*.*.*`.

```bash
# From an up-to-date main
git checkout main && git pull
git tag v0.3.2
git push origin v0.3.2
```

This runs CI checks, then builds and pushes **both** Docker images to ACR tagged with the version
**and** `latest`, and creates a GitHub Release with an auto-generated changelog. It does **not**
deploy anything.

Watch it:

```bash
gh run list --workflow "Release & Build Images" --limit 3
gh run watch <run-id>
```

Confirm the images landed:

```bash
az acr repository show-tags --name pokehub --repository pokehub-api  --output table
az acr repository show-tags --name pokehub --repository pokehub-app  --output table
```

> **Re-tagging.** If a release build fails and you fix the underlying commit on `main`, move the tag
> to the new commit and force-push it to re-trigger the build:
> ```bash
> git tag -f v0.3.2 <new-commit-sha>
> git push origin v0.3.2 --force
> ```

## Step 2 — Deploy (migrate + roll out)

`deploy.yml` is **manual** (`workflow_dispatch`). It runs under the GitHub `production` environment,
so it can require an approval before it proceeds.

From the GitHub UI: **Actions → "Deploy to Azure Container Apps" → Run workflow**, then set:

- **version** — the tag to deploy (e.g. `v0.3.2`) or `latest`.
- **app** — `both`, `api`, or `app`.

Or from the CLI:

```bash
gh workflow run "Deploy to Azure Container Apps" -f version=v0.3.2 -f app=both
gh run watch <run-id>
```

What it does, in order:

1. **Run DB migrations** — `drizzle-kit migrate` against the DB in the GitHub `DB_*` secrets (only
   when deploying `api` or `both`). If migrations fail, the API deploy is skipped.
2. **Deploy API**, then **Deploy App** — verifies the image tag exists in ACR, regenerates
   `platform/container-apps/.env` from GitHub secrets, stamps the image tag into the manifest, and
   applies it with [`deploy.sh`](../../platform/container-apps/deploy.sh). API is deployed before the
   App so it's available when the frontend starts.
3. **Verify** — checks each app's `runningStatus` and dumps recent logs on failure.

### Post-deploy verification

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api.pokehub.space/api/health   # expect 200
az containerapp revision list --name pokehub-api --resource-group pokehub_group \
  --query "[?properties.active].{name:name,running:properties.runningState,health:properties.healthState}" -o table
```

## Prerequisites and secrets

`deploy.yml` reconstructs all runtime configuration from **GitHub secrets** on every run — it never
reads the live Container App. So the secrets are the real source of truth for a deployment.

- **Database:** `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — see
  [database.md](./database.md). ⚠️ **If you migrate the database, update these first** or the deploy
  will migrate/point at the old DB.
- **Redis:** `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- **Registry / Azure:** `ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_CREDENTIALS`.
- **App:** `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `AZURE_STORAGE_ACCOUNT_KEY`, `REFRESH_TOKEN_SECRET`, `ACCESS_TOKEN_SECRET`.

The full table and service-principal setup are in [ci-cd-workflows.md](./ci-cd-workflows.md).

## Deploying by hand (no GitHub Actions)

When you need to deploy without the workflow (e.g. patching a secret), do what `deploy.yml` does,
locally:

```bash
cd platform/container-apps
# .env (gitignored) must contain the current DB_*, REDIS_*, ACR_PASSWORD, token + Google secrets
./deploy.sh pokehub-api      # or pokehub-app
```

`deploy.sh` templates the `REPLACE_WITH_*` placeholders in `pokehub-{api,app}.yaml` from `.env`,
applies the manifest with `az containerapp update --yaml`, and restarts the active revision. See
[container-apps/operations.md](./container-apps/operations.md).

> **The manifest is authoritative.** `deploy.sh` applies the *entire* Container App manifest,
> including the env-var → secret mappings. Setting a secret with `az containerapp secret set` alone
> is not enough if the deployed revision's manifest doesn't map it to an env var — always redeploy
> the current manifest so new env vars (e.g. the `REDIS_*` block) are wired in. This is a real
> failure mode; see the [troubleshooting guide](./container-apps/troubleshooting.md).

## Rollback

Images are retained per version in ACR, so rolling back is just deploying an older tag:

```bash
gh workflow run "Deploy to Azure Container Apps" -f version=v0.3.1 -f app=both
```

Beware DB migrations are not automatically reversed — only roll back to a version whose schema is
compatible with the current database.

## Related

- [CI/CD workflows](./ci-cd-workflows.md) — per-workflow detail, secrets table, service principal.
- [Database setup](./database.md) — production DB, provisioning, credential sync.
- [Container Apps operations](./container-apps/operations.md) — `deploy.sh`, logs, scaling.
- [Container Apps troubleshooting](./container-apps/troubleshooting.md) — crash-loops, DB/Redis.
