# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

PokeHub is a Next.js Pokemon application built with an Nx monorepo architecture. It features a frontend Pokemon explorer app and a NestJS backend API, with extensive shared libraries for reusable components and utilities.

## Common Commands

### Development

- `nx serve pokehub-app` - Start frontend development server (<http://localhost:4200>)
- `nx serve pokehub-api` - Start backend API development server
- `nx serve pokehub-app pokehub-api` - Start both frontend and backend together

### Building

- `nx build pokehub-app` - Build frontend for production
- `nx build pokehub-api` - Build backend API
- `nx run-many -t build` - Build all projects

### Testing

- `nx test pokehub-app` - Run frontend tests
- `nx test pokehub-api` - Run backend tests
- `nx run-many -t test` - Run all tests
- `nx test <package-name>` - Run tests for specific package (e.g., `nx test frontend-shared-ui-components`)

### Linting

- `nx lint pokehub-app` - Lint frontend
- `nx lint pokehub-api` - Lint backend
- `nx run-many -t lint` - Lint all projects

### Database

- `npx tsx --tsconfig tsconfig.base.json node_modules/drizzle-kit/bin.cjs generate --config=drizzle.config.pg.ts` - Generate migrations
- `npx tsx --tsconfig tsconfig.base.json node_modules/drizzle-kit/bin.cjs push --config=drizzle.config.pg.ts` - Push schema changes to database

**Note:** We use `tsx` with `--tsconfig tsconfig.base.json` instead of `npx drizzle-kit` directly because:

- Drizzle-kit doesn't resolve TypeScript path aliases (e.g., `@pokehub/backend/pokehub-users-db`) by default ([GitHub issue #1228](https://github.com/drizzle-team/drizzle-orm/issues/1228))
- `tsx` respects tsconfig paths, allowing schemas to import from other packages using aliases
- `bin.cjs` is the drizzle-kit CLI entry point that we invoke directly to use tsx as the runtime

## Architecture

### Monorepo Structure

- `apps/` - Main applications
  - `pokehub-app/` - Next.js frontend application with App Router
  - `pokehub-api/` - NestJS backend API
  - `*-e2e/` - End-to-end test projects
- `packages/` - Shared libraries organized by domain
  - `frontend/` - React/Next.js specific packages
  - `backend/` - NestJS specific packages
  - `shared/` - Cross-platform shared models and utilities

### Frontend Architecture

- **Next.js 14** with App Router and TypeScript
- **Authentication**: NextAuth.js v5 with Google OAuth
- **State Management**: TanStack Query for server state, React Context for client state
- **Styling**: Tailwind CSS with Radix UI components
- **Forms**: React Hook Form with Zod validation

### Backend Architecture

- **NestJS** with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with Passport.js strategies
- **Logging**: Winston with structured logging
- **File Storage**: Azure Blob Storage

### Key Shared Libraries

#### Frontend Packages

- `frontend-shared-ui-components` - Reusable UI components (buttons, forms, etc.)
- `frontend-pokehub-dex-components` - Pokemon-specific components
- `frontend-pokehub-nav-components` - Navigation components
- `frontend-shared-auth-*` - Authentication utilities and providers
- `frontend-shared-data-provider` - API client and query configurations
- `dex-data-provider` - Pokemon data fetching hooks

#### Backend Packages

- `backend-shared-auth-utils` - JWT services, guards, decorators
- `backend-pokehub-postgres` - Database connection and configuration
- `backend-pokehub-users-db` - User database operations
- `backend-shared-logger` - Logging utilities

#### Shared Models

- `shared-shared-auth-models` - Authentication request/response types
- `shared-shared-user-models` - User data models

### Database Schema

- Users table with OAuth integration
- Profile management with avatar uploads
- Drizzle ORM for type-safe database operations

### External APIs

- **Pokemon Data**: @pkmn/dex, @pkmn/data for comprehensive Pokemon information
- **PokeAPI**: Secondary data source via pokeapi-js-wrapper
- **Pokemon Showdown**: Move and ability data

## Development Patterns

### Component Organization

- Components follow domain-driven design within packages
- Shared UI components use Radix UI primitives
- Pokemon-specific components encapsulate data fetching logic

### Data Fetching

- TanStack Query hooks for server state management
- Custom hooks in dex-data-provider for Pokemon data
- API client centralized in shared-data-provider

### Authentication Flow

- Google OAuth via NextAuth.js
- JWT tokens for API authentication
- Route guards for protected pages
- Profile creation flow for new users

### Styling Conventions

- Tailwind CSS with custom design system
- Dark/light theme support via next-themes
- Consistent spacing and typography scales
- Pokemon type-based color schemes

### Testing Strategy

- Jest for unit testing
- React Testing Library for component tests
- Playwright for e2e tests
- Test setup files in individual packages

## Key Configuration Files

- `nx.json` - Nx workspace configuration
- `tsconfig.base.json` - TypeScript base configuration
- `tailwind.config.js` - Global Tailwind configuration
- `drizzle.config.pg.ts` - Database configuration
- Individual `project.json` files define per-project build targets

## Documentation

### Documentation Location

- **Always check `docs/` directory** for existing documentation before making changes
- Documentation includes architecture, patterns, feature docs, and deployment guides

### Key Documentation Files

- `docs/ARCHITECTURE.md` - High-level system architecture overview
- `docs/development/backend-system.md` - Backend architecture and APIs
- `docs/development/code-style-and-patterns.md` - Coding conventions
- `docs/development/data-fetching-patterns.md` - TanStack Query patterns
- `docs/development/common-patterns-and-recipes.md` - Code snippets and recipes
- `docs/development/building-and-optimization.md` - Build and bundle optimization
- `docs/features/` - Feature-specific documentation (authentication, pokedex, team-builder)
- `docs/deployment/` - Deployment guides

### Implementation Plans

- **Create new plans in `docs/plans/`** directory
- Plans should document the problem, solution approach, and implementation steps
- Reference plans when implementing features for context

