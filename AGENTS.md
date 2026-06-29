# PokeHub — Agent Guide

Canonical, tool-agnostic instructions for **any** AI coding agent (Claude Code, GitHub Copilot,
OpenCode, Codex, Gemini CLI, Cursor, …). Keep this file lean — it is always-on context. Detailed
procedures live in skills and load on demand; this file holds only what applies to *every* change.

## Stack

Nx monorepo — **Next.js 14 (App Router)** frontend + **NestJS** backend, **PostgreSQL/Drizzle**,
**npm**, **Node 20**. Apps in `apps/`; shared libraries in `packages/{frontend,backend,shared}`.
Overview: `docs/ARCHITECTURE.md`. The CI gate is the source of truth: `.github/workflows/ci.yml`.

## Harness map

- **`AGENTS.md`** (this file) — canonical conventions, read by every tool.
- **`.agents/skills/<name>/SKILL.md`** — on-demand procedures; consult them for scaffolding
  packages/components, Drizzle migrations, and running the CI gate.
- **`CLAUDE.md`** — Claude Code adapter (imports this file) + a format/lint hook and permission
  allowlist in `.claude/settings.json`; `.claude/agents/pokehub-reviewer.md` is the reviewer subagent.
- **`.github/copilot-instructions.md`** — GitHub Copilot adapter. OpenCode reads this file natively.
- **Reviewer:** logic lives in the `code-review` skill (portable); the `pokehub-reviewer` agent files
  in `.claude/agents/`, `.opencode/agent/`, and `.github/agents/` are thin triggers that invoke it.
- **`docs/development/`** — deep-dive docs (code style, data fetching, testing, bundle size).

## Conventions that always apply

These bind every change (even edits that trigger no skill) and double as the review criteria.

- **UI:** never use raw HTML primitives (`<button>`, `<input>`, `<select>`, `<dialog>`) when a
  `@pokehub/frontend/shared-ui-components` (shadcn) component exists. Merge classes with `cn()`; use
  semantic color tokens (`bg-background`, `text-muted-foreground`) + `dark:` variants, not hard-coded
  colors. Use `next/image`, `next/link`, and `lucide-react` icons.
- **Client boundary:** add `'use client'` only to components using hooks/state/effects/context; keep
  pages and layouts as server components.
- **Data:** server state via **TanStack Query** hooks — key shape `[domain, id, { provider, type,
  ...options }]`, id-dependent queries use `enabled: !!id`. Go through the shared fetch client
  (`@pokehub/frontend/shared-data-provider`), not raw `fetch`.
- **Structure:** shared code lives in a `packages/<category>/*` lib; import via `@pokehub/*` aliases,
  not deep relative paths. After adding/changing a package alias, run
  `npx nx g @pokehub/workspace-plugin:fix-path-aliases` (CI fails if it leaves a diff).
- **Backend:** NestJS DI via tokens (testable with mocks); Zod DTO validation + `ValidationPipe`.
  Ship Drizzle schema changes with a committed generated migration, and always invoke drizzle-kit
  through `tsx --tsconfig tsconfig.base.json` (never `npx drizzle-kit` directly).
- **Tests:** co-locate `*.spec.ts(x)`. React tests wrap renders in `QueryClientProvider` (retries
  off); NestJS uses `Test.createTestingModule` with `useValue` mocks; Playwright uses
  role/label/test-id selectors.
- **Docs:** a change isn't done until the docs match it. When a change affects architecture, a
  shared library's API, a reusable pattern, or a feature, update the relevant file under `docs/`
  (and `CLAUDE.md`'s "Key Shared Libraries" for new shared packages). Check `docs/` before changing
  behavior; record larger plans in `docs/plans/`.
- **CI gate (before every PR):** changes must pass typecheck → lint → typecheck-spec → test → build
  on **affected** projects. The frontend also faces a bundle-size limit (`pokehub-app`: 550KB gzipped
  absolute, +10KB vs main). Run the `ci-check` skill; report failures honestly with real output.
- **Discovery & impact:** use graphify to locate code and to trace what depends on a changed export;
  scale review scrutiny to centrality (high fan-in / god-node changes are higher-risk).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
