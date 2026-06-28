# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

PokeHub is a Next.js Pokemon application built with an Nx monorepo architecture. It features a frontend Pokemon explorer app and a NestJS backend API, with extensive shared libraries for reusable components and utilities.

## Agent Harness

This repo ships a Claude Code harness in `.claude/` that encodes how we build here. Use it:

- **Skills** (`.claude/skills/`) — invoke with `/<name>`:
  - `/new-package` — scaffold a shared Nx library (naming, project.json, tsconfig trio, path alias, `fix-path-aliases`).
  - `/new-component` — build a frontend component/hook (shadcn UI rule, `cn()`, TanStack Query keys, `'use client'` boundaries, theming).
  - `/db-migrate` — Drizzle migrations via the required `tsx --tsconfig tsconfig.base.json` invocation.
  - `/ci-check` — run the CI gate locally (typecheck → lint → typecheck-spec → test → build on affected) before a PR.
- **Reviewer subagent** (`.claude/agents/pokehub-reviewer.md`) — run after implementing a feature / before a PR to check the diff against project conventions. Spawn it via the Agent tool (`subagent_type: pokehub-reviewer`).
- **Hooks** (`.claude/settings.json`) — every edited `.ts/.tsx` under `apps|packages|tools` is auto-formatted (Prettier) and auto-linted (ESLint `--fix`); remaining lint errors are surfaced so they get fixed immediately.
- **Permissions** (`.claude/settings.json`) — safe `nx`, read-only `git`, and `gh` commands are pre-approved; force-push and hard-reset are denied.

**Discovery layer — graphify.** A persistent knowledge graph lives in `graphify-out/`. To locate code, understand architecture, or trace the impact of a change (what depends on X), query graphify *first* rather than guessing or grepping blindly. The harness delegates locational facts to graphify and keeps only prescriptive rules in the skills — so if a skill and the graph disagree on where something lives, trust the graph. The graph is a snapshot: rebuild it with `/graphify` after structural changes (new/moved packages) or queries will mislead.

When making changes, default to these workflows so design, testing, and pipeline conventions stay consistent. The CI gate is the source of truth (`.github/workflows/ci.yml`).

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

### UI Components

- **Always use `@pokehub/frontend/shared-ui-components`** for UI primitives (Button, Card, Tabs, ScrollArea, Dialog, etc.)
- This package is built on **shadcn/ui** (Radix UI + Tailwind). If a component you need isn't exported yet, check [shadcn/ui](https://ui.shadcn.com/) and add it to the shared-ui-components package first
- Never use raw HTML elements (e.g. `<button>`, `<input>`, `<dialog>`) when a shared component exists

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

