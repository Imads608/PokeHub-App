---
name: pr-review
description: Pre-PR preflight for PokeHub — bring the branch up to date, run the CI gate, run the convention review, and summarize so you only open a PR when it's green and convention-clean. Use before opening or updating a PR to main.
---

# Pre-PR review (PokeHub)

Run this before opening (or updating) a PR to `main`. It bundles the deterministic gate and the
convention review so nothing reaches CI red. The same convention review also runs automatically on
the PR via `.github/workflows/claude-code-review.yml` — this is the local preflight.

## Steps

1. **Sync with main.** `git fetch origin main` and rebase/merge so the diff and the CI `affected`
   set are computed against current `main`.

2. **Run the CI gate** — follow the `ci-check` skill (path-aliases → typecheck → lint →
   typecheck-spec → test → build on affected; bundle-size on frontend). It must be **green**; fix
   failures before continuing. Report real output, don't paper over failures.

3. **Run the convention review** — follow the `code-review` skill on `git diff main...HEAD`
   (Claude Code users: spawn the `pokehub-reviewer` subagent; other tools: invoke their
   `pokehub-reviewer` agent or the `code-review` skill directly). Criteria come from
   `AGENTS.md` → "Conventions that always apply".

4. **Summarize and gate the decision:**
   ```
   ## PR readiness
   CI gate:        <pass / fail — which step>
   Review blockers: <count + one-line each, or "none">
   Should-fix:      <count>
   Bundle size:     <within limit / +Xkb vs main>

   Verdict: <ready to open PR | fix blockers first>
   ```
   Only open the PR when the gate is green and there are **no Blockers**. Should-fix/Nits can be
   addressed in the PR or called out in its description (e.g. an expected bundle-size increase needing
   `/approve-bundle-size`).

## Notes
- This does not push or open the PR for you — it tells you whether to. Pushing/PR creation stays an
  explicit step.
- Keep it fast by relying on Nx caching: unchanged projects are skipped on re-run.
