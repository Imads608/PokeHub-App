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
- Database connection failure

---

### Issue: Cannot connect to database

**Symptoms**: App starts but database operations fail

**Checklist**:
1. Verify environment variables are correct
2. Check if using connection pooler (IPv4 compatible)
3. Verify secrets are set correctly
4. Check if SSL is properly configured

**Debug commands**:

```bash
# Verify DB environment variables
az containerapp show \
  --name pokehub-api \
  --resource-group pokehub_group \
  --query "properties.template.containers[0].env[?name=='DB_HOST']" \
  -o json
```

**Solutions**:
- Ensure using Supabase connection pooler: `aws-1-us-east-1.pooler.supabase.com`
- Verify DB_PASSWORD secret is set correctly
- Check SSL is enabled for production: `DB_SSL=true`

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
