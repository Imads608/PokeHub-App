# DNS and Multi-Region Infrastructure Options

This document outlines options for hosting PokeHub on the root domain (`pokehub.space`) and strategies for multi-region deployment.

## Table of Contents

- [Current Infrastructure](#current-infrastructure)
- [Problem: Apex/Root Domain Support](#problem-apexroot-domain-support)
- [Option 1: Cloudflare (Recommended)](#option-1-cloudflare-recommended)
  - [Cost](#cost)
  - [Migration Steps](#migration-steps)
  - [Changes Summary](#changes-summary)
  - [Benefits](#benefits)
- [Option 2: Azure Front Door](#option-2-azure-front-door)
- [Multi-Region Deployment](#multi-region-deployment)
  - [Option A: Cloudflare Load Balancing (Recommended)](#option-a-cloudflare-load-balancing-recommended)
  - [Option B: Azure Traffic Manager](#option-b-azure-traffic-manager)
  - [Option C: Azure Front Door (Multi-Region)](#option-c-azure-front-door-multi-region)
  - [Multi-Region Comparison](#multi-region-comparison)
  - [Database Considerations](#database-considerations)
- [Recommended Path Forward](#recommended-path-forward)
- [Quick Reference](#quick-reference)
- [Bot Protection](#bot-protection)
  - [Comparison by Tier](#comparison-by-tier)
  - [Cloudflare Free Bot Protection](#cloudflare-free-bot-protection)
  - [When to Upgrade to Cloudflare Pro](#when-to-upgrade-to-cloudflare-pro-20month)
  - [Application-Level Bot Protection](#application-level-bot-protection)
  - [Recommendation for PokeHub](#recommendation-for-pokehub)

---

## Current Infrastructure

| Resource | Specification | Monthly Cost |
|----------|---------------|--------------|
| Container Apps Environment | East US | ~$25-35 |
| Backend API (`pokehub-api`) | 1-3 replicas, 1 CPU, 2 GB | ~$15-20 |
| Frontend App (`pokehub-app`) | 1-3 replicas, 1 CPU, 2 GB | ~$15-20 |
| Supabase PostgreSQL | Free tier (500MB) | $0 |
| Azure DNS Zone | pokehub.space | ~$0.50 |
| Azure Container Registry | Basic tier | ~$5 |
| **Total** | | **~$55-75/month** |

### Current Domain Configuration

- Frontend: `www.pokehub.space` (CNAME → Container App FQDN)
- Backend API: `api.pokehub.space` (CNAME → Container App FQDN)

---

## Problem: Apex/Root Domain Support

Azure Container Apps doesn't natively support apex domains (e.g., `pokehub.space` without `www`) because:

- Apex domains require A records (IP addresses)
- Container Apps use dynamic FQDNs, not static IPs
- Azure DNS alias records don't support Container Apps as targets

### Solutions

| Solution | Cost | Complexity | Apex Support |
|----------|------|------------|--------------|
| Cloudflare (Free) | $0 | Low | Yes (CNAME flattening) |
| Azure Front Door | ~$35-40/month | Medium | Yes |
| Keep `www` subdomain | $0 | None | No (workaround) |

---

## Option 1: Cloudflare (Recommended)

Cloudflare's free tier provides CNAME flattening, which allows apex domains to work with CNAME-style records.

### Cost

| Tier | Monthly Cost | Features |
|------|--------------|----------|
| **Free** | **$0** | DNS, CNAME flattening, SSL, DDoS protection, CDN |
| Pro | $20 | + WAF, image optimization |
| Business | $200 | + Advanced WAF, 100% SLA |

**Recommendation**: Free tier is sufficient for PokeHub.

### Migration Steps

#### 1. Create Cloudflare Account
- Sign up at [cloudflare.com](https://cloudflare.com)
- Add your domain (`pokehub.space`)

#### 2. Update Nameservers
At your domain registrar, change nameservers to Cloudflare's (provided during setup).

#### 3. Configure DNS Records in Cloudflare

| Type | Name | Target | Proxy Status |
|------|------|--------|--------------|
| CNAME | `@` (root) | `pokehub-app.kindglacier-9db9a67b.eastus.azurecontainerapps.io` | Proxied |
| CNAME | `api` | `pokehub-api.kindglacier-9db9a67b.eastus.azurecontainerapps.io` | Proxied |
| CNAME | `www` | `pokehub.space` | Proxied (redirect to root) |

#### 4. SSL/TLS Settings
- Set encryption mode to **Full (strict)**
- Cloudflare will use its own edge certificates
- Azure managed certificates remain active for origin connection

#### 5. Update Application Configuration

Update `platform/container-apps/pokehub-app.yaml`:
```yaml
env:
  - name: NEXT_API_URL
    value: https://pokehub.space
  - name: NEXTAUTH_URL
    value: https://pokehub.space
```

#### 6. Update OAuth Callbacks
In Google Cloud Console, update authorized redirect URI:
- `https://pokehub.space/api/auth/callback/google`

#### 7. (Optional) Remove Azure DNS Zone
```bash
az network dns zone delete \
  --name pokehub.space \
  --resource-group pokehub_group
```
Saves ~$0.50/month.

### Changes Summary

| Component | Change Required |
|-----------|-----------------|
| Azure Container Apps | None |
| Azure DNS Zone | Delete or disable (optional) |
| Domain Registrar | Update nameservers to Cloudflare |
| Cloudflare | Add domain + DNS records |
| App Config | Update `www.pokehub.space` → `pokehub.space` |
| OAuth | Update callback URLs |

### Benefits

- Apex domain support (`pokehub.space`)
- Free CDN (faster global load times)
- Free DDoS protection
- Free SSL/TLS certificates
- Easy DNS management UI

---

## Option 2: Azure Front Door

Azure Front Door is Microsoft's global load balancer and CDN service.

### Cost

| Component | Cost |
|-----------|------|
| Base (Standard tier) | ~$35/month |
| Data transfer | $0.08-0.16/GB |
| Requests | $0.01/10K requests |
| **Estimated Total** | **~$36-40/month** |

### When to Use

- Need Microsoft-native solution
- Require advanced WAF capabilities
- Want integrated Azure monitoring
- Enterprise compliance requirements

### Setup Overview

```bash
# Create Front Door profile
az afd profile create \
  --profile-name pokehub-fd \
  --resource-group pokehub_group \
  --sku Standard_AzureFrontDoor

# Add endpoint
az afd endpoint create \
  --endpoint-name pokehub \
  --profile-name pokehub-fd \
  --resource-group pokehub_group

# Add origin group and origins for Container Apps
# Configure routing rules
# Add custom domain with managed certificate
```

### Not Recommended For PokeHub

At ~$36-40/month additional cost, Front Door would nearly double your infrastructure spend. Cloudflare Free provides similar benefits at no cost.

---

## Multi-Region Deployment

For deploying to multiple Azure regions (e.g., East US + West US).

### Architecture

```
                    ┌─────────────────┐
                    │  DNS/Load       │
                    │  Balancer       │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │   East US       │           │   West US       │
    │   pokehub-app   │           │   pokehub-app   │
    │   pokehub-api   │           │   pokehub-api   │
    └─────────────────┘           └─────────────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Supabase     │
                    │    (Primary)    │
                    └─────────────────┘
```

### Option A: Cloudflare Load Balancing (Recommended)

**Cost**: $5/month + $0.50/500K DNS queries

**Features**:
- Geographic routing (users → nearest region)
- Health checks with automatic failover
- Session affinity (stick users to same region)
- Weighted routing (e.g., 70% East US, 30% West US)
- Easy setup if already using Cloudflare DNS

#### Architecture with Cloudflare

```
                         ┌─────────────────────────────┐
                         │        Cloudflare           │
                         │      (Global Edge)          │
                         │                             │
                         │  - DNS + CNAME Flattening   │
                         │  - CDN/Caching              │
                         │  - DDoS Protection          │
                         │  - Load Balancing           │
                         │  - Bot Protection           │
                         └──────────────┬──────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
            ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
            │  East US    │     │  West US    │     │  Europe     │
            │  Container  │     │  Container  │     │  Container  │
            │  Apps       │     │  Apps       │     │  Apps       │
            └─────────────┘     └─────────────┘     └─────────────┘
```

Every request through Cloudflare gets CDN caching, DDoS protection, SSL termination, and bot protection - regardless of which region serves it.

#### Setup Steps

1. **Enable Load Balancing** in Cloudflare dashboard (Traffic → Load Balancing)

2. **Create Origin Pool**:
   - Pool name: `pokehub-origins`
   - Add origins:
     - `pokehub-app-eastus.kindglacier-9db9a67b.eastus.azurecontainerapps.io`
     - `pokehub-app-westus.<env-id>.westus.azurecontainerapps.io`

3. **Configure Health Checks**:
   - Type: HTTP
   - Path: `/api/health`
   - Interval: 60 seconds
   - Timeout: 5 seconds
   - Retries: 2

4. **Create Load Balancer**:
   - Hostname: `pokehub.space`
   - Select origin pool: `pokehub-origins`
   - Steering policy: **Proximity** (routes to nearest healthy origin)

5. **Set Routing Policy**:
   | Policy | Description |
   |--------|-------------|
   | Proximity | Route to geographically nearest origin |
   | Geo | Route based on user's country/region |
   | Random | Distribute randomly (with weights) |
   | Least Outstanding Requests | Route to least busy origin |

#### Load Balancing vs Workers (Free Alternative)

| Feature | Load Balancing ($5/mo) | Workers (Free) |
|---------|------------------------|----------------|
| Geographic routing | ✅ Built-in | ✅ With code |
| Health checks | ✅ Automatic | ❌ Manual |
| Automatic failover | ✅ | ❌ |
| Session affinity | ✅ | ⚠️ With code |
| Setup complexity | Low (UI) | Medium (code) |

**Workers alternative** (free, 100K requests/day):
```javascript
// Cloudflare Worker for basic geo-routing
export default {
  async fetch(request) {
    const country = request.cf.country;

    const origins = {
      US: 'pokehub-app-eastus.azurecontainerapps.io',
      CA: 'pokehub-app-eastus.azurecontainerapps.io',
      MX: 'pokehub-app-eastus.azurecontainerapps.io',
      GB: 'pokehub-app-europe.azurecontainerapps.io',
      DE: 'pokehub-app-europe.azurecontainerapps.io',
      FR: 'pokehub-app-europe.azurecontainerapps.io',
      default: 'pokehub-app-eastus.azurecontainerapps.io'
    };

    const origin = origins[country] || origins.default;
    const url = new URL(request.url);
    url.hostname = origin;

    return fetch(url, request);
  }
}
```

**Recommendation**: Pay the $5/month for Load Balancing. Health checks and automatic failover are critical for production reliability.

### Option B: Azure Traffic Manager

**Cost**: ~$0.54/million DNS queries + health check costs (~$1-5/month total)

**Features**:
- DNS-level traffic routing
- Multiple routing methods (Performance, Geographic, Priority, Weighted)
- Native Azure integration

**Setup**:
```bash
# Create Traffic Manager profile
az network traffic-manager profile create \
  --name pokehub-tm \
  --resource-group pokehub_group \
  --routing-method Performance \
  --unique-dns-name pokehub

# Add East US endpoint
az network traffic-manager endpoint create \
  --name eastus-endpoint \
  --profile-name pokehub-tm \
  --resource-group pokehub_group \
  --type externalEndpoints \
  --target pokehub-app-eastus.azurecontainerapps.io \
  --endpoint-location eastus

# Add West US endpoint
az network traffic-manager endpoint create \
  --name westus-endpoint \
  --profile-name pokehub-tm \
  --resource-group pokehub_group \
  --type externalEndpoints \
  --target pokehub-app-westus.azurecontainerapps.io \
  --endpoint-location westus

# Update DNS
# CNAME: www.pokehub.space → pokehub.trafficmanager.net
```

**Routing Methods**:
| Method | Description |
|--------|-------------|
| Performance | Route to lowest-latency endpoint |
| Geographic | Route based on user's geographic location |
| Priority | Primary/secondary failover |
| Weighted | Distribute by percentage |

### Option C: Azure Front Door (Multi-Region)

**Cost**: ~$35-40/month base + per-region backend costs

**Features**:
- Global anycast network
- Intelligent routing
- Built-in CDN and WAF
- Session affinity

### Multi-Region Comparison

| Solution | Monthly Cost | Best For |
|----------|--------------|----------|
| **Cloudflare LB** | ~$5-10 | Already using Cloudflare, simple setup |
| **Azure Traffic Manager** | ~$1-5 | Azure-native, DNS-level routing |
| **Azure Front Door** | ~$35-40 | Full CDN + WAF + advanced routing |

### Database Considerations

For multi-region deployments, consider database replication:

| Option | Description | Cost Impact |
|--------|-------------|-------------|
| Single Supabase (current) | All regions connect to one DB | Latency for distant regions |
| Supabase Read Replicas | Read replicas in multiple regions | Supabase Pro ($25/month) + replica costs |
| Azure Cosmos DB | Global distribution built-in | Significantly higher cost |

**Recommendation**: Start with single Supabase instance. Database latency is often acceptable for moderate traffic. Add read replicas only if latency becomes a measurable issue.

---

## Recommended Path Forward

### Phase 1: Apex Domain (Now)
1. Migrate DNS to Cloudflare (Free)
2. Configure CNAME flattening for `pokehub.space`
3. Update application configuration
4. Remove Azure DNS zone (optional, saves $0.50/month)

**Cost change**: -$0.50/month (or $0 if keeping Azure DNS as backup)

### Phase 2: Multi-Region (Future, if needed)
1. Deploy second Container Apps environment in West US
2. Enable Cloudflare Load Balancing ($5/month)
3. Configure geographic routing

**Additional cost**: ~$60-80/month (second region) + $5/month (load balancing)

### Phase 3: Advanced (Future, if needed)
- Database read replicas
- Advanced WAF rules
- Custom caching rules

---

## Quick Reference

### Current State
```
Domain Registrar → Azure DNS → Azure Container Apps (East US)
Cost: ~$55-75/month
Apex domain: Not supported
```

### After Cloudflare Migration
```
Domain Registrar → Cloudflare DNS → Azure Container Apps (East US)
Cost: ~$55-75/month (same)
Apex domain: Supported
Bonus: Free CDN, DDoS protection
```

### Future Multi-Region
```
Domain Registrar → Cloudflare DNS + LB → Azure Container Apps (East US + West US)
Cost: ~$120-160/month
Apex domain: Supported
Geographic routing: Yes
Failover: Automatic
```

---

## Bot Protection

### Comparison by Tier

| Feature | Cloudflare Free | Cloudflare Pro ($20) | Azure Front Door Standard | Azure Front Door Premium |
|---------|----------------|---------------------|---------------------------|-------------------------|
| Basic bot detection | Yes | Yes | No | Yes |
| Bot Fight Mode | Basic | Advanced | No | Yes |
| Challenge pages (CAPTCHA) | Yes | Yes | No | Yes |
| Bot Analytics | No | Yes | No | Yes |
| Custom bot rules | No | Yes | No | Yes |
| Rate limiting | 1 rule | 10 rules | Limited | Advanced |
| **Cost** | **$0** | **$20/mo** | **~$35/mo** | **~$330/mo** |

### Cloudflare Free Bot Protection

What you get for free:

- **Bot Fight Mode**: Blocks known bad bots (scrapers, credential stuffers, spam bots)
- **Browser Integrity Check**: Challenges requests with suspicious HTTP headers
- **Hotlink Protection**: Prevents other sites from embedding your images
- **Basic Rate Limiting**: 1 free rule to limit request frequency

#### Enabling Bot Protection (Cloudflare Free)

1. Log into Cloudflare Dashboard
2. Select your domain (`pokehub.space`)
3. Go to **Security → Bots**
4. Toggle **Bot Fight Mode** to ON
5. Go to **Security → Settings**
6. Set **Browser Integrity Check** to ON

#### Setting Up Rate Limiting

1. Go to **Security → WAF → Rate limiting rules**
2. Create a rule:
   - **Name**: `Login rate limit`
   - **Expression**: `(http.request.uri.path contains "/api/auth")`
   - **Rate**: 10 requests per minute
   - **Action**: Block for 1 hour

### What Free Tier Doesn't Cover

| Gap | Risk Level | Mitigation |
|-----|------------|------------|
| No bot analytics | Low | Monitor server logs manually |
| No custom bot rules | Low | Basic rules sufficient for most cases |
| Limited rate limiting | Medium | Single rule can protect critical endpoints |
| No API abuse detection | Medium | Implement app-level rate limiting if needed |
| No ML-based detection | Low | Bot Fight Mode catches most threats |

### When to Upgrade to Cloudflare Pro ($20/month)

Consider upgrading if you experience:

| Problem | Indicator |
|---------|-----------|
| Scraping attacks | High bandwidth usage, unusual traffic patterns |
| Credential stuffing | Multiple failed login attempts from varied IPs |
| API abuse | Excessive API calls, data exfiltration attempts |
| Sophisticated bots | Bots bypassing basic Bot Fight Mode |

### Application-Level Bot Protection

In addition to Cloudflare, consider implementing in your NestJS backend:

```typescript
// Example: Rate limiting with @nestjs/throttler
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,        // Time window in seconds
      limit: 10,      // Max requests per window
    }),
  ],
})
export class AppModule {}
```

### Recommendation for PokeHub

**Phase 1 (Now)**: Cloudflare Free
- Enable Bot Fight Mode
- Enable Browser Integrity Check
- Add rate limiting rule for `/api/auth` endpoints
- **Cost**: $0

**Phase 2 (If needed)**: Cloudflare Pro
- Upgrade only if bot attacks become a problem
- Adds bot analytics to understand attack patterns
- More rate limiting rules
- **Cost**: $20/month

**Phase 3 (Enterprise)**: Azure Front Door Premium
- Only for compliance/enterprise requirements
- **Cost**: ~$330/month (not recommended for PokeHub)
