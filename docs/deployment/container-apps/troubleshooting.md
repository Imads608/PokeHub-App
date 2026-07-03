# Azure Container Apps Troubleshooting

This guide covers common issues and debugging techniques for PokeHub Container Apps.

## Table of Contents
- [Diagnostic Commands](#diagnostic-commands)
- [Common Issues](#common-issues)
- [Testing Connectivity](#testing-connectivity)

---

## Diagnostic Commands

### Check Container App Status

```bash
# Show container app details
az containerapp show \
  --name pokehub-api \
  --resource-group pokehub_group

# Check running status
az containerapp show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --query "properties.runningStatus" \
  -o tsv
```

### List All Revisions

```bash
az containerapp revision list \
  --name pokehub-api \
  --resource-group pokehub_group \
  -o table
```

### Check Replica Status

```bash
az containerapp replica list \
  --name pokehub-api \
  --resource-group pokehub_group \
  --revision pokehub-api--0000005 \
  -o table
```

### Debug Environment Variables

```bash
# List all environment variables
az containerapp show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --query "properties.template.containers[0].env" \
  -o json
```

### View SSL Certificate Status

```bash
# List custom domains
az containerapp hostname list \
  --name pokehub-api \
  --resource-group pokehub_group \
  -o table

# Check certificate binding
az containerapp show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --query "properties.configuration.ingress.customDomains" \
  -o json
```

---

## Common Issues

### Issue: Container keeps restarting

**Symptoms**: Container repeatedly restarts, never stabilizes

**Solution**: Check logs for startup errors

```bash
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --tail 100 \
  --follow false
```

**Common causes**:
- Application crashes on startup
- Missing or incorrect environment variables
- Port mismatch (app must listen on port 3000)
- Database connection failure (see below)
- Redis connection failure (see below) — the API **requires** Redis for the battle system and
  exits if it can't connect at boot

> A crash-loop on one dependency (e.g. the database) can **mask** a second latent failure (e.g.
> Redis), because the app never reaches the second dependency's initialization. After fixing one
> boot error, re-check the logs — the next one may appear.

---

### Issue: Cannot connect to database

**Symptoms**: App logs `error: (ENOTFOUND) tenant/user ... not found` or a `pg-pool` failure at
boot, then the container exits and restarts (crash-loop).

**Checklist**:
1. Verify the `DB_*` environment variables / secrets are correct on the active revision.
2. Confirm the database server exists and is reachable.
3. Verify SSL is configured (`DB_SSL=true` / `NODE_ENV=production`).
4. Confirm the Postgres firewall allows Azure resources (the `0.0.0.0` "allow Azure services" rule).

**Debug commands**:

```bash
# Verify DB environment variables on the active revision
az containerapp show --name pokehub-api --resource-group pokehub_group \
  --query "properties.template.containers[0].env[?starts_with(name,'DB_')]" -o json

# Check the Postgres server state and firewall
az postgres flexible-server show -g pokehub_group -n pokehub-pg-d65dd1 \
  --query "{state:state, fqdn:fullyQualifiedDomainName}" -o json
az postgres flexible-server firewall-rule list -g pokehub_group -n pokehub-pg-d65dd1 -o table
```

**Solutions**:
- Production runs on **Azure Database for PostgreSQL Flexible Server**
  (`pokehub-pg-d65dd1.postgres.database.azure.com`) — see [database.md](../database.md).
  The `tenant/user ... not found` error is the signature of a **deleted/paused Supabase project**;
  if you see it, the old Supabase DB is gone and you must repoint at the Azure DB (or provision a
  new one) and sync all three credential locations.
- Verify the `db-password` secret is correct and that a **new revision** was created after changing
  it (secret changes don't apply to a running revision).
- Ensure SSL is enabled for production (`DB_SSL=true`).

---

### Issue: Redis connection fails fast

**Symptoms**: DB connects (`Successfully connected to DB: ...`) but the API then logs repeated
`Redis error:` (often with an empty message), `Redis connection failed after 4 attempts`, and
`Error: Connection is closed`, then exits. The failures happen in well under a second (fast), unlike
a network timeout.

**Root causes seen in this project**:

1. **The deployed revision has no `REDIS_*` env vars.** If the running Container App manifest
   predates the battle/Redis infra, the API falls back to `localhost:6379` with no TLS and fails
   instantly. Setting the `redis-*` secrets alone does **not** fix this — the manifest must map them
   to env vars.

   ```bash
   # Does the active revision actually map REDIS_* ?
   az containerapp revision show --name pokehub-api --resource-group pokehub_group \
     --revision <active-revision> \
     --query "properties.template.containers[0].env[?contains(name,'REDIS')].name" -o json
   ```

   **Fix:** redeploy the *current* manifest so the `REDIS_*` env block is wired in:
   ```bash
   cd platform/container-apps && ./deploy.sh pokehub-api
   ```

2. **The Redis firewall blocks the client.** Azure Cache for Redis firewall rules are **allowlists**
   — once any rule exists, only those IP ranges may connect. Unlike Azure Postgres, a `0.0.0.0`
   rule does **not** mean "allow Azure services" for Redis; it matches nothing and effectively
   blocks everyone (fails with `ETIMEDOUT`, ~15s). Container Apps on a Consumption environment
   without VNet integration have **no stable outbound IP** to allowlist, so the pragmatic fix is to
   remove the firewall rules and rely on TLS + the access key:

   ```bash
   az redis firewall-rules list  --name pokehub-cache --resource-group pokehub_group -o table
   az redis firewall-rules delete --name pokehub-cache --resource-group pokehub_group --rule-name <rule>
   ```

   Verify connectivity (requires TLS on port 6380 + the primary key):
   ```bash
   RKEY=$(az redis list-keys --name pokehub-cache --resource-group pokehub_group --query primaryKey -o tsv)
   node -e "const R=require('ioredis');const r=new R({host:'pokehub-cache.redis.cache.windows.net',port:6380,password:process.env.RKEY,tls:{}});r.ping().then(x=>{console.log(x);process.exit(0)}).catch(e=>{console.log(e.message);process.exit(1)})"
   ```

The client is built in `packages/backend/pokehub-redis/src/lib/redis.service.ts` (TLS on when
`REDIS_TLS=true`, fast fail after 3 retries).

---

### Issue: Image build fails with `NX Cannot find module '/app'`

**Symptoms**: The **Release & Build Images** workflow (or a local `docker build`) fails inside the
builder stage running `npx nx build ...` with `NX Cannot find module '/app'` and a
`load-resolved-plugin` stack trace.

**Cause**: `nx.json` registers the local Nx plugin `@pokehub/workspace-plugin`, which lives in
`tools/workspace-plugin/`. Every `nx` command loads it, but the Dockerfiles must copy `tools/` into
the build context. This regressed when the plugin was registered without updating the Docker setup.

**Fix** (already applied): both Dockerfiles `COPY tools ./tools` in the builder stage, and `tools`
is **not** listed in `.dockerignore`. If it recurs, confirm those two things. Host CI won't catch
this because `nx` there runs against the full working tree, not the reduced Docker context.

---

### Issue: Image not updating after push

**Symptoms**: New code doesn't appear despite pushing new image

**Solution**: Force new revision

```bash
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --set-env-vars "BUILD_ID=$(date +%s)"
```

**Why this happens**:
- Container Apps caches images when tag hasn't changed
- Using `:dev` tag doesn't trigger automatic pull

**Prevention**:
- Use unique tags for each build (e.g., `:v1.0.1`, `:build-123`)
- Or always force new revision after pushing

---

### Issue: 502 Bad Gateway

**Symptoms**: HTTP 502 error when accessing app

**Possible causes**:
- App not listening on correct port (should be 3000)
- App crashed on startup
- Health check failing

**Debug steps**:

1. Check running status:
```bash
az containerapp show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --query "properties.runningStatus"
```

2. Check recent logs:
```bash
az containerapp logs show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --tail 50
```

3. Verify port configuration in YAML:
```yaml
ingress:
  targetPort: 3000  # Must match app listening port
```

---

### Issue: SSL certificate not provisioning

**Symptoms**: Custom domain shows SSL error or "not secure"

**Debug**:

```bash
# Check certificate status
az containerapp hostname list \
  --name pokehub-api \
  --resource-group pokehub_group \
  -o table
```

**Solutions**:
- Wait 10-15 minutes for provisioning (can take time)
- Verify DNS records are correct (CNAME or TXT)
- Check domain validation method matches DNS setup
- Ensure no CAA records blocking certificate issuance

---

### Issue: High memory or CPU usage

**Symptoms**: App slow or crashing under load

**Debug**:

```bash
# Check current resource limits
az containerapp show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --query "properties.template.containers[0].resources"
```

**Solutions**:

```bash
# Increase resources
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --cpu 2.0 \
  --memory 4Gi

# Scale replicas
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --max-replicas 5
```

---

## Testing Connectivity

### Test API Endpoint

```bash
# Test custom domain
curl -I https://api.pokehub.space/api

# Test default URL
curl -I https://pokehub-api.kindglacier-9db9a67b.eastus.azurecontainerapps.io/api

# Verbose curl for debugging
curl -v https://api.pokehub.space/api
```

### Test from Container

```bash
# Execute command in running container
az containerapp exec \
  --name pokehub-api \
  --resource-group pokehub_group \
  --command /bin/sh
```

### DNS Verification

```bash
# Verify DNS resolution
nslookup api.pokehub.space

# Check CNAME record
dig api.pokehub.space CNAME
```

---

## Restart Container App

```bash
# Trigger new revision to restart
az containerapp update \
  --name pokehub-api \
  --resource-group pokehub_group \
  --set-env-vars "RESTART_TIME=$(date +%s)"
```

---

## Getting Help

If you encounter issues not covered here:

1. Check [Azure Container Apps Documentation](https://learn.microsoft.com/en-us/azure/container-apps/troubleshooting)
2. Review application logs thoroughly
3. Verify all environment variables and secrets
4. Check Azure status page for service outages
5. Contact Azure support for infrastructure issues
