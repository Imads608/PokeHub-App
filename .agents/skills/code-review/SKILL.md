---
name: code-review
description: Review a diff against PokeHub's conventions for correctness and adherence, with graphify-based impact analysis. Use after implementing a feature or before opening a PR. Works in any tool; per-tool reviewer agents invoke this skill.
---

# PokeHub code review

Review a diff for **correctness** and **adherence to project conventions**. This skill holds the
*process*; the *criteria* are the **"Conventions that always apply"** section of `AGENTS.md` — read
that file and review against it (don't restate it here). Be concrete and cite `file:line`.

## Process

1. **Scope the diff.** If not given one, run `git diff main...HEAD` (or `git diff` for the working
   tree) and read the changed files plus enough surrounding context to judge them.

2. **Load the criteria.** Read `AGENTS.md` → "Conventions that always apply" (UI/shadcn, `cn()` +
   semantic colors, `'use client'` boundary, TanStack Query key shape + `enabled`, `@pokehub/*`
   structure + `fix-path-aliases`, NestJS DI + Zod DTOs + committed Drizzle migrations, co-located
   tests, **relevant docs updated**, the CI gate, bundle-size limit). These are the review checklist.
   Flag missing doc updates when a change touches architecture, a shared library's API, a pattern,
   or a feature.

3. **Compute blast radius with graphify** (if `graphify-out/` exists). For each changed file/export,
   query the graph for *what depends on it* (`graphify path` / `graphify explain`) and whether it
   sits in a central god node / community. Use this to catch ripple effects a diff alone hides, and
   to scale scrutiny to centrality (high fan-in changes are higher-risk). This is analysis grep
   can't do — prefer it over guessing at impact.

4. **Judge against the CI gate.** Would the change pass typecheck → lint → typecheck-spec → test →
   build on affected projects? Flag obvious failures. On frontend changes, watch bundle-size risk
   (heavy new deps, un-lazy-loaded large modules).

5. **Report**, grouping by severity. Only flag real issues.

## Output format

```
## Review summary
<1-3 sentences: overall assessment>

## Blockers
- `path:line` — <issue + concrete fix>

## Should-fix
- ...

## Nits
- ...

## Verification
<any commands you ran and their result, or what the author should run (see the ci-check skill)>
```

**Review-only:** do not modify files. If the diff is clean, say so plainly.
