# PokeHub — Copilot instructions

This project's canonical, tool-agnostic agent guide is **[`AGENTS.md`](../AGENTS.md)** at the repo
root. Read it first and follow it — it holds the build/test/review conventions and the CI gate.

Key pointers:
- **Conventions & workflows:** see `AGENTS.md` (creating packages/components, Drizzle migrations,
  the CI quality gate, and the code-review checklist).
- **Reusable skills:** `.agents/skills/<name>/SKILL.md` (`new-package`, `new-component`,
  `db-migrate`, `ci-check`) — step-by-step procedures Copilot can discover and apply.
- **Discovery:** a graphify knowledge graph lives in `graphify-out/`; prefer it for locating code
  and tracing change impact (see the graphify section in `AGENTS.md`).

Do not duplicate guidance here — update `AGENTS.md` so every tool stays in sync.
