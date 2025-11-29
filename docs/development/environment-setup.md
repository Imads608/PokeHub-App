# Development Environment Setup

This guide covers setting up your local development environment for PokeHub.

## Table of Contents
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Production Configuration](#production-configuration)
- [Deployment-Specific Environment Files](#deployment-specific-environment-files)
- [Required Variables Reference](#required-variables-reference)
- [Security Best Practices](#security-best-practices)
- [Generating Secrets](#generating-secrets)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

---

## Environment Variables

PokeHub uses environment files to manage configuration across different environments. The project supports multiple environment files that can be switched based on your current needs.

### Environment Files Structure

```
project-root/
├── .env                    # Active environment (gitignored)
├── .env.local             # Local development config
├── .env.production        # Production config (Supabase)
└── .env.template          # Template with all required variables
```

### File Purposes

- **`.env.template`** - Template showing all required environment variables (committed to git)
- **`.env.local`** - Local development configuration with PostgreSQL (gitignored)
- **`.env.production`** - Production configuration with Supabase (gitignored)
- **`.env`** - Active environment file used by the application (gitignored)

### Switching Environments

To switch between local and production environments, simply copy the appropriate file:

```bash
# Use local development environment
cp .env.local .env

# Use production environment
cp .env.production .env
```

## Local Development Setup

### 1. Create Local Environment File

Copy the template:

```bash
cp .env.template .env.local
```

### 2. Configure Local Variables

Edit `.env.local` with your local development settings:

```bash
# Database (Local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pokehub_dev
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# API Configuration
NODE_ENV=development
PORT=3000

# Authentication (for local testing)
NEXTAUTH_URL=http://localhost:4200
NEXTAUTH_SECRET=local-development-secret-change-in-production

# OAuth (optional for local dev)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# API URLs
API_URL=http://localhost:3000
APP_URL=http://localhost:4200
```

### 3. Start Local Database

Start a local PostgreSQL instance using Docker:

```bash
docker run -d \
  --name pokehub-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pokehub_dev \
  -p 5432:5432 \
  postgres:14-alpine
```

### 4. Activate Local Environment

```bash
cp .env.local .env
```

### 5. Run Database Migrations

```bash
npx drizzle-kit push --config=drizzle.config.pg.ts
```

## Production Configuration

### 1. Create Production Environment File

Copy the template:

```bash
cp .env.template .env.production
```

### 2. Configure Production Variables

Edit `.env.production` with your production settings:

```bash
# Database (Supabase)
DB_HOST=aws-1-us-east-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.wxrhnixjscveeamupgam
DB_PASSWORD=your-supabase-password
DB_SSL=true

# API Configuration
NODE_ENV=production
PORT=3000

# Authentication
NEXTAUTH_URL=https://pokehub.space
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# OAuth Credentials
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret

# API URLs
API_URL=https://api.pokehub.space
APP_URL=https://pokehub.space
```

### 3. Activate Production Environment

```bash
cp .env.production .env
```

## Deployment-Specific Environment Files

### Container Apps Deployment

For Azure Container Apps deployment, there's a separate `.env` file in `platform/container-apps/.env`:

```bash
# Azure Container Registry
ACR_PASSWORD=your-acr-password

# Database
DB_PASSWORD=your-supabase-password

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# URLs
API_URL=https://api.pokehub.space
APP_URL=https://pokehub.space
```

This file is used by the `deploy.sh` script to inject secrets into the YAML configuration files.

See [deployment documentation](../deployment/README.md) for more details.

## Required Variables Reference

### Database Variables

- `DB_HOST` - Database host (localhost or Supabase pooler)
- `DB_PORT` - Database port (usually 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_SSL` - Enable SSL for database connection (true/false)

### Application Variables

- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Backend API port (default: 3000)

### Authentication Variables

- `NEXTAUTH_URL` - Full URL of your application
- `NEXTAUTH_SECRET` - Secret for session encryption (generate with `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Service URLs

- `API_URL` - Backend API URL
- `APP_URL` - Frontend application URL

## Security Best Practices

1. **Never commit `.env` files** - All environment files are in `.gitignore`
2. **Use different secrets for each environment** - Never reuse production secrets in development
3. **Generate strong secrets** - Use `openssl rand -base64 32` for generating secrets
4. **Rotate secrets regularly** - Especially in production
5. **Use `.env.template`** - Keep it updated with all required variables (without actual values)

## Generating Secrets

### NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Local: `http://localhost:4200/api/auth/callback/google`
   - Production: `https://pokehub.space/api/auth/callback/google`

### Azure Container Registry Password

```bash
az acr credential show --name pokehub --query "passwords[0].value" -o tsv
```

## Troubleshooting

### Environment Variables Not Loading

1. Ensure `.env` file exists in project root
2. Check file is properly formatted (no quotes around values unless needed)
3. Restart development server after changing environment variables

### Database Connection Issues

1. Verify database is running (`docker ps`)
2. Check environment variables are correct
3. Ensure SSL setting matches your database configuration
4. For Supabase, use connection pooler URL (not direct database URL)

### OAuth Not Working

1. Verify OAuth credentials are correct
2. Check redirect URIs match in Google Console
3. Ensure `NEXTAUTH_URL` matches your current environment

## Additional Resources

- [Database Setup Guide](../deployment/database.md)
- [Deployment Guide](../deployment/README.md)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
