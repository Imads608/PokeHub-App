# PokeHub Architecture Overview

This document provides a high-level overview of the PokeHub application architecture. For detailed information on specific topics, see the linked documentation.

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Monorepo Structure](#monorepo-structure)
4. [Application Architecture](#application-architecture)
5. [Data Flow](#data-flow)
6. [Key Architectural Decisions](#key-architectural-decisions)
7. [Related Documentation](#related-documentation)

---

## System Overview

PokeHub is a full-stack Pokemon application built as an Nx monorepo. It consists of two main applications and numerous shared libraries that enable code reuse across the frontend and backend.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PokeHub System                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        External Services                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │   │
│  │  │   Google    │  │   Azure     │  │   Pokemon Data Sources      │  │   │
│  │  │   OAuth     │  │   Blob      │  │  (@pkmn/dex, PokeAPI)       │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────────────┬──────────────┘  │   │
│  └─────────┼────────────────┼────────────────────────┼──────────────────┘   │
│            │                │                        │                      │
│  ┌─────────┴────────────────┴────────────────────────┴──────────────────┐   │
│  │                         Frontend (Next.js)                            │   │
│  │                         localhost:4200                                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  NextAuth   │  │   React     │  │  TanStack   │  │  Tailwind   │  │   │
│  │  │  (Auth)     │  │   Components│  │  Query      │  │  CSS        │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └───────────────────────────────┬──────────────────────────────────────┘   │
│                                  │ HTTP/REST                                │
│  ┌───────────────────────────────┴──────────────────────────────────────┐   │
│  │                         Backend (NestJS)                              │   │
│  │                         localhost:3000/api                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Auth      │  │   Users     │  │   Teams     │  │   JWT       │  │   │
│  │  │   Module    │  │   Module    │  │   Module    │  │   Service   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └───────────────────────────────┬──────────────────────────────────────┘   │
│                                  │ SQL                                      │
│  ┌───────────────────────────────┴──────────────────────────────────────┐   │
│  │                         Database (PostgreSQL)                         │   │
│  │                         Drizzle ORM                                   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology          | Purpose                         |
| ------------------- | ------------------------------- |
| **Next.js 14**      | React framework with App Router |
| **TypeScript**      | Type-safe JavaScript            |
| **Tailwind CSS**    | Utility-first CSS framework     |
| **Radix UI**        | Accessible component primitives |
| **TanStack Query**  | Server state management         |
| **NextAuth.js v5**  | Authentication (Google OAuth)   |
| **React Hook Form** | Form state management           |
| **Zod**             | Schema validation               |

### Backend

| Technology      | Purpose                       |
| --------------- | ----------------------------- |
| **NestJS**      | Node.js framework             |
| **TypeScript**  | Type-safe JavaScript          |
| **Drizzle ORM** | Type-safe database operations |
| **PostgreSQL**  | Relational database           |
| **Passport.js** | Authentication strategies     |
| **Winston**     | Structured logging            |

### External Services

| Service                | Purpose                |
| ---------------------- | ---------------------- |
| **Google OAuth**       | User authentication    |
| **Azure Blob Storage** | Avatar file storage    |
| **@pkmn/dex**          | Pokemon data library   |
| **PokeAPI**            | Secondary Pokemon data |

### Development

| Tool           | Purpose             |
| -------------- | ------------------- |
| **Nx**         | Monorepo management |
| **Jest**       | Unit testing        |
| **Playwright** | E2E testing         |
| **ESLint**     | Code linting        |

---

## Monorepo Structure

The codebase follows domain-driven organization with clear separation between frontend, backend, and shared code.

```
pokehub-app/
├── apps/                           # Main applications
│   ├── pokehub-app/               # Next.js frontend
│   │   ├── app/                   # App Router pages
│   │   │   ├── (components)/      # Shared page components
│   │   │   ├── api/               # Next.js API routes
│   │   │   ├── login/             # Login page
│   │   │   ├── create-profile/    # Profile creation
│   │   │   ├── pokedex/           # Pokemon browser
│   │   │   ├── team-builder/      # Team building
│   │   │   └── settings/          # User settings
│   │   └── public/                # Static assets
│   │
│   ├── pokehub-api/               # NestJS backend
│   │   └── src/
│   │       ├── app/               # App module & config
│   │       ├── auth/              # Authentication
│   │       ├── users/             # User management
│   │       ├── teams/             # Team management
│   │       └── common/            # Shared utilities
│   │
│   └── *-e2e/                     # E2E test projects
│
├── packages/                       # Shared libraries
│   ├── frontend/                  # React/Next.js packages
│   │   ├── shared-ui-components/  # Reusable UI (Button, Card, etc.)
│   │   ├── shared-auth/           # NextAuth configuration
│   │   ├── shared-auth-provider/  # Auth React context
│   │   ├── shared-app-router/     # Route guards
│   │   ├── shared-data-provider/  # API client
│   │   ├── dex-data-provider/     # Pokemon data hooks
│   │   ├── pokehub-dex-components/# Pokemon UI components
│   │   ├── pokehub-nav-components/# Navigation components
│   │   └── pokehub-team-builder/  # Team builder components
│   │
│   ├── backend/                   # NestJS packages
│   │   ├── shared-auth-utils/     # JWT, guards, decorators
│   │   ├── shared-logger/         # Winston logging
│   │   ├── shared-exceptions/     # Custom exceptions
│   │   ├── pokehub-postgres/      # Database connection
│   │   └── pokehub-users-db/      # User DB operations
│   │
│   └── shared/                    # Cross-platform packages
│       ├── shared-auth-models/    # Auth types
│       └── shared-user-models/    # User types
│
├── docs/                          # Documentation
├── drizzle/                       # Database migrations
└── nx.json                        # Nx configuration
```

### Package Naming Convention

```
@pokehub/<scope>/<name>

Scopes:
  frontend  - React/Next.js packages
  backend   - NestJS packages
  shared    - Cross-platform packages

Examples:
  @pokehub/frontend/shared-ui-components
  @pokehub/backend/shared-auth-utils
  @pokehub/shared/shared-user-models
```

---

## Application Architecture

### Frontend Architecture

The frontend uses Next.js 14 with the App Router, combining Server and Client Components for optimal performance.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend Architecture                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    App Router (app/)                            │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │    │
│  │  │ Server       │  │ Client       │  │ API Routes           │  │    │
│  │  │ Components   │  │ Components   │  │ (/api/*)             │  │    │
│  │  │ (default)    │  │ ('use client')│ │                      │  │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │    │
│  └─────────┼─────────────────┼──────────────────────┼──────────────┘    │
│            │                 │                      │                   │
│  ┌─────────┴─────────────────┴──────────────────────┴──────────────┐    │
│  │                       Providers Layer                            │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │    │
│  │  │ Session    │  │ Auth       │  │ Query      │  │ Theme      │ │    │
│  │  │ Provider   │  │ Provider   │  │ Provider   │  │ Provider   │ │    │
│  │  │ (NextAuth) │  │            │  │ (TanStack) │  │            │ │    │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        Shared Packages                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │ UI          │  │ Data        │  │ Pokemon     │               │   │
│  │  │ Components  │  │ Providers   │  │ Components  │               │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Patterns:**

- **Server Components** (default): Data fetching, static content, SEO
- **Client Components** (`'use client'`): Interactivity, hooks, state
- **Route Groups**: `(components)` for shared page components
- **Parallel Data Fetching**: TanStack Query with HydrationBoundary

### Backend Architecture

The backend follows NestJS modular architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Backend Architecture                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         Request Flow                              │   │
│  │                                                                   │   │
│  │  Request → Middleware → Guards → Controller → Service → Database │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         Module Structure                          │   │
│  │                                                                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │   │
│  │  │   Auth Module   │  │   Users Module  │  │   Teams Module  │   │   │
│  │  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤   │   │
│  │  │ Controller      │  │ Controller      │  │ Controller      │   │   │
│  │  │ Service         │  │ Service         │  │ Service         │   │   │
│  │  │ Guards          │  │ Guards          │  │ Guards          │   │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                       Shared Services                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │ JWT Service │  │ Logger      │  │ Postgres    │               │   │
│  │  │             │  │ Service     │  │ Service     │               │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Patterns:**

- **Modular Design**: Self-contained feature modules
- **Dependency Injection**: NestJS DI container
- **Guards**: Authentication (JWT, OAuth) and authorization (Roles)
- **Interface-Based Design**: Services implement interfaces for testability
- **Shared Packages**: Reusable utilities in monorepo packages

---

## Data Flow

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │ Frontend │     │ Backend  │     │  Google  │
│          │     │ NextAuth │     │ NestJS   │     │  OAuth   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ Click Login    │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ Redirect       │                │
     │<───────────────│────────────────│───────────────>│
     │                │                │                │
     │ Authorize      │                │                │
     │───────────────────────────────────────────────────>│
     │                │                │                │
     │                │                │  ID Token      │
     │<──────────────────────────────────────────────────│
     │                │                │                │
     │                │ POST /auth/oauth-login          │
     │                │ (with Google ID token)          │
     │                │───────────────>│                │
     │                │                │                │
     │                │                │ Verify Token   │
     │                │                │───────────────>│
     │                │                │<───────────────│
     │                │                │                │
     │                │ JWT Tokens     │                │
     │                │ + User Data    │                │
     │                │<───────────────│                │
     │                │                │                │
     │ Redirect to    │                │                │
     │ Dashboard      │                │                │
     │<───────────────│                │                │
     │                │                │                │
```

**Token Types:**

- **Access Token**: 1 hour expiry, used for API requests
- **Refresh Token**: 12 hour expiry, used to get new access tokens

### API Request Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  React   │     │ TanStack │     │ Fetch    │     │ Backend  │
│  Component│    │ Query    │     │ Client   │     │ API      │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ useQuery()     │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ Check Cache    │                │
     │                │────────┐       │                │
     │                │<───────┘       │                │
     │                │                │                │
     │                │ Cache Miss     │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │                │ GET /api/...   │
     │                │                │ Authorization: │
     │                │                │ Bearer <token> │
     │                │                │───────────────>│
     │                │                │                │
     │                │                │  401 Expired?  │
     │                │                │<───────────────│
     │                │                │                │
     │                │                │ Retry with     │
     │                │                │ refreshed token│
     │                │                │───────────────>│
     │                │                │                │
     │                │                │    200 OK      │
     │                │                │<───────────────│
     │                │                │                │
     │                │ Update Cache   │                │
     │                │<───────────────│                │
     │                │                │                │
     │ Render Data    │                │                │
     │<───────────────│                │                │
     │                │                │                │
```

**Key Features:**

- **Automatic Retry**: `withAuthRetry` handles 401 responses
- **Cache Management**: TanStack Query caches responses
- **Query Keys**: Hierarchical keys for cache invalidation

### Server-Side Data Fetching

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Browser │     │  Server  │     │ TanStack │     │ Backend  │
│          │     │ Component│     │ Query    │     │ API      │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ Page Request   │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ prefetchQuery()│                │
     │                │───────────────>│                │
     │                │                │                │
     │                │                │ Fetch Data     │
     │                │                │───────────────>│
     │                │                │                │
     │                │                │    Response    │
     │                │                │<───────────────│
     │                │                │                │
     │                │ dehydrate()    │                │
     │                │<───────────────│                │
     │                │                │                │
     │ HTML + Hydrated│                │                │
     │ Query State    │                │                │
     │<───────────────│                │                │
     │                │                │                │
     │ Client hydrates│                │                │
     │ No loading     │                │                │
     │ state!         │                │                │
     │                │                │                │
```

---

## Key Architectural Decisions

### 1. Monorepo with Nx

**Why**: Code sharing, consistent tooling, atomic changes across frontend/backend.

**Benefits**:

- Shared TypeScript types between frontend and backend
- Single dependency management
- Incremental builds and caching
- Consistent linting and testing

### 2. Next.js App Router

**Why**: Modern React patterns, Server Components, built-in API routes.

**Benefits**:

- Server Components reduce client JavaScript
- Built-in routing and layouts
- API routes for Next.js-specific features (SAS URL generation)
- Streaming and Suspense support

### 3. NestJS for Backend

**Why**: Enterprise-grade framework with TypeScript, dependency injection, modular architecture.

**Benefits**:

- Strong typing throughout
- Testable via dependency injection
- Built-in support for guards, middleware, interceptors
- Good ecosystem (Passport, validation, etc.)

### 4. Drizzle ORM

**Why**: Type-safe, lightweight ORM that feels like SQL.

**Benefits**:

- Full TypeScript inference from schema
- No runtime overhead
- Easy to write complex queries
- Migration support

### 5. TanStack Query for Server State

**Why**: Powerful data fetching with caching, background updates, and optimistic updates.

**Benefits**:

- Automatic caching and cache invalidation
- Background refetching
- Query deduplication
- SSR support with HydrationBoundary

### 6. Google OAuth Only

**Why**: Simplified authentication, no password management.

**Benefits**:

- Email verification handled by Google
- No password storage
- Familiar login flow for users
- Reduced security surface

### 7. Azure Blob Storage for Files

**Why**: Scalable file storage with SAS token support.

**Benefits**:

- Direct client-to-storage uploads
- Time-limited access tokens
- Cost-effective for infrequent access
- CDN integration possible

### 8. Shared Packages Organization

**Why**: Clear boundaries between frontend, backend, and shared code.

**Benefits**:

- Prevents accidental mixing of concerns
- Explicit dependencies
- Easy to identify reusable code
- Facilitates team ownership

---

## Related Documentation

### Core Documentation

| Document                                                      | Description                                      |
| ------------------------------------------------------------- | ------------------------------------------------ |
| [Backend System](./backend-system.md)                         | Detailed backend architecture, modules, and APIs |
| [Code Style & Patterns](./code-style-and-patterns.md)         | Coding conventions and component patterns        |
| [Data Fetching Patterns](./data-fetching-patterns.md)         | TanStack Query patterns and examples             |
| [Common Patterns & Recipes](./common-patterns-and-recipes.md) | Copy-paste code snippets                         |

### Feature Documentation

| Document                                       | Description                       |
| ---------------------------------------------- | --------------------------------- |
| [Authentication](./features/authentication.md) | OAuth, JWT, profile creation      |
| [Pokedex](./features/pokedex.md)               | Pokemon data fetching and display |
| [Team Builder](./features/team-builder.md)     | Team creation and management      |

### Development & Deployment

| Document                                                  | Description                        |
| --------------------------------------------------------- | ---------------------------------- |
| [Environment Setup](./development/environment-setup.md)   | Local development setup            |
| [Building & Optimization](./building-and-optimization.md) | Production builds, bundle analysis |
| [Deployment Guide](./deployment/README.md)                | Azure Container Apps deployment    |
| [Database](./deployment/database.md)                      | PostgreSQL setup and migrations    |

### Testing

| Document                                                                | Description      |
| ----------------------------------------------------------------------- | ---------------- |
| [Unit & Integration Testing](./development/unit-integration-testing.md) | Jest testing     |
| [Frontend E2E Testing](./development/frontend-e2e-testing.md)           | Playwright tests |
| [Backend E2E Testing](./development/backend-e2e-testing.md)             | API testing      |

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start development servers
nx serve pokehub-app          # Frontend (http://localhost:4200)
nx serve pokehub-api          # Backend (http://localhost:3000)
nx serve pokehub-app pokehub-api  # Both

# Run tests
nx test pokehub-app           # Frontend tests
nx test pokehub-api           # Backend tests
nx run-many -t test           # All tests

# Build for production
nx build pokehub-app          # Frontend
nx build pokehub-api          # Backend

# Database
npx tsx --tsconfig tsconfig.base.json node_modules/drizzle-kit/bin.cjs generate --config=drizzle.config.pg.ts
npx tsx --tsconfig tsconfig.base.json node_modules/drizzle-kit/bin.cjs push --config=drizzle.config.pg.ts
```

---

## Architecture Diagrams Legend

```
┌───────────┐    Box: Component or Service
│           │
└───────────┘

────────────>    Arrow: Data/Control Flow

─────┬──────     T-Junction: Multiple destinations
     │
     ↓

┌─────────────┐
│   Module    │  Module: Self-contained unit
├─────────────┤
│  Contents   │
└─────────────┘
```
