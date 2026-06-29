---
name: ci-check
description: Run the same quality gate locally that PokeHub CI enforces (path-aliases, typecheck, lint, typecheck-spec, test, build) on affected projects, before pushing or opening a PR. Use when the user asks to verify changes, pre-flight a PR, or check if CI will pass.
---

# Run the PokeHub CI gate locally

`.github/workflows/ci.yml` blocks a PR unless every check below passes. Run them locally in the
same order to catch failures before pushing. CI runs against **affected** projects (Node 20, npm).

## The gate, in order

```bash
# 0. Path aliases must be normalized (CI fails if this produces a diff)
npx nx g @pokehub/workspace-plugin:fix-path-aliases
git diff --exit-code tsconfig.base.json    # must be clean

# 1. Typecheck
npx nx affected -t typecheck --parallel=3

# 2. Lint
npx nx affected -t lint --parallel=3

# 3. Typecheck spec files
npx nx affected -t typecheck-spec --parallel=3

# 4. Unit tests with coverage (CI configuration)
npx nx affected -t test --parallel=3 --configuration=ci --coverage

# 5. Production build
npx nx affected -t build --parallel=2 --configuration=production
```

If E2E projects are affected, also:
```bash
npx nx e2e pokehub-api-e2e
npx nx build pokehub-app && npx nx e2e pokehub-app-e2e -- --project=chromium
```

## Bundle size gate (frontend)

CI fails the PR if `pokehub-app`'s gzipped client bundle exceeds **550KB absolute** or grows
**>10KB vs main**. After a frontend change, sanity-check the production build size. A legitimate
increase can be approved by an authorized reviewer commenting `/approve-bundle-size <reason>` on
the PR (see `.github/bundle-reviewers.yml`) — note this in your PR description if you expect it.

## Tips
- To scope to a single project instead of affected: replace `affected` with `run <project>`
  (e.g. `npx nx run frontend-shared-utils:test`).
- Nx caches results, so re-running after a fix only re-executes what changed.
- `NX_NO_CLOUD=true` is set in CI; local runs may use Nx Cloud cache (configured in `nx.json`).
- Report failures honestly with the actual output — don't claim the gate passed if a step failed.
