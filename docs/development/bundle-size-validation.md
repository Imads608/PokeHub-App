# Bundle Size Validation

This document describes the bundle size validation system that prevents accidental bundle size regressions from being merged into the main branch.

## Overview

The CI pipeline validates bundle sizes using [Statoscope](https://statoscope.tech/), a webpack bundle analyzer. It enforces:

1. **Absolute limits** - Maximum allowed bundle size
2. **Diff limits** - Maximum allowed increase compared to main branch

When validation fails, authorized reviewers can approve the increase via a PR comment command.

## How It Works

### Build Phase

1. The build runs with `ANALYZE=true`, which generates Statoscope stats files
2. Stats are uploaded as artifacts:
   - **Main branch:** `bundle-stats-main` (retained 90 days for PR comparisons)
   - **PRs:** `bundle-stats-pr-{number}` (retained 7 days for debugging)

### Validation Phase

1. For PRs, the main branch stats are downloaded for comparison
2. Statoscope CLI validates:
   - Initial bundle increase vs main is under the diff limit (10KB)
3. `tools/validate-bundle-size.ts` validates:
   - Accurate per-route initial bundle is under the absolute limit (550KB)
   - Per-route increase vs main is under 10KB
4. If either validation fails, a comment is posted with instructions

### Approval Phase

1. An authorized reviewer comments `/approve-bundle-size <reason>`
2. The `bundle-approval.yml` workflow triggers
3. If the commenter is authorized, CI automatically re-runs
4. The re-run finds the approval comment and passes

## Validation Rules

Configured in `statoscope.config.js`:

```js
module.exports = {
  validate: {
    plugins: ['@statoscope/webpack'],
    reporters: ['@statoscope/console'],
    rules: {
      // Absolute per-route limits are in tools/validate-bundle-size.ts

      // Initial bundle diff limit vs main branch
      '@statoscope/webpack/diff-entry-download-size-limits': [
        'error',
        { global: { maxInitialSizeDiff: 10 * 1024 } }, // 10KB
      ],

      // Warn on duplicate packages (doesn't fail build)
      '@statoscope/webpack/no-packages-dups': ['warn'],

      // Build time limit
      '@statoscope/webpack/build-time-limits': ['error', 300000], // 5 minutes
    },
  },
};
```

### Why Two Validation Steps

Statoscope's `entry-download-size-limits` rule recursively walks chunk children and uses webpack's global `initial` flag per-chunk (not per-entrypoint). In Next.js App Router, the root layout is parent to all page chunks in webpack's graph, so statoscope rolls up every page's chunks into `app/layout`'s "initial size" — producing inflated numbers ([statoscope#256](https://github.com/statoscope/statoscope/issues/256)).

**Statoscope diff rule** (`diff-entry-download-size-limits`) is kept because relative comparisons are still directionally correct — both sides use the same methodology.

**`tools/validate-bundle-size.ts`** computes accurate per-route sizes by summing the deduplicated gzipped assets from `main` + `main-app` + layout chain + page entrypoint. Routes and layout chains are auto-discovered from the stats JSON.

## Approving Bundle Size Increases

### Who Can Approve

Users listed in `.github/bundle-reviewers.yml`:

```yaml
approvers:
  - Imads608
  # Add other GitHub usernames here
```

### How to Approve

1. Review the PR and confirm the bundle increase is justified
2. Comment on the PR:
   ```
   /approve-bundle-size adding recharts library for analytics dashboard
   ```
3. The CI workflow will automatically re-run and pass

### Approval Behavior

- **Approvals reset on new commits** - If the PR author pushes new changes after approval, they must be re-approved
- **Reason is captured** - The approval reason is visible in the PR timeline for audit purposes
- **Automatic re-run** - After approval, CI re-runs automatically (no manual action needed)
- **Visual feedback** - A 🚀 reaction is added to valid approvals, 😕 to unauthorized attempts

### What Happens on Approval

```
1. User comments /approve-bundle-size <reason>
           ↓
2. bundle-approval.yml workflow triggers
           ↓
3. Workflow checks if commenter is in bundle-reviewers.yml
           ↓
   ┌───────┴───────┐
   ↓               ↓
Authorized    Unauthorized
   ↓               ↓
🚀 reaction    😕 reaction
   ↓               ↓
Re-run CI      Post rejection
   ↓            comment
CI passes
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       PR Created/Updated                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Build with ANALYZE=true                       │
│              (generates statoscope-stats-client.json)            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Upload PR bundle stats artifact                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│               Download main branch stats artifact                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Statoscope CLI validates:                      │
│            - Absolute limit (550KB First Load JS)                │
│            - Diff limit (10KB increase vs main)                  │
└─────────────────────────────────────────────────────────────────┘
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
        ┌─────────────┐                  ┌─────────────┐
        │  ✅ Passed   │                  │  ❌ Failed   │
        └─────────────┘                  └─────────────┘
               │                                 │
               ▼                                 ▼
        ┌─────────────┐         ┌─────────────────────────────────┐
        │    Done     │         │  Check for /approve-bundle-size  │
        └─────────────┘         │  comment after last commit       │
                                └─────────────────────────────────┘
                                                │
                               ┌────────────────┴────────────────┐
                               ▼                                 ▼
                      ┌──────────────┐                  ┌──────────────┐
                      │ Found valid  │                  │  Not found   │
                      │   approval   │                  │              │
                      └──────────────┘                  └──────────────┘
                               │                                 │
                               ▼                                 ▼
                      ┌──────────────┐         ┌──────────────────────────┐
                      │  ✅ Pass job  │         │  Post comment with       │
                      └──────────────┘         │  instructions, fail job  │
                                               └──────────────────────────┘
```

## Local Testing

Test bundle validation locally before pushing:

```bash
# Build with analysis enabled
ANALYZE=true nx build pokehub-app

# Validate per-route sizes (absolute limits)
npx tsx tools/validate-bundle-size.ts \
  apps/pokehub-app/statoscope-stats-client.json

# Compare per-route sizes against a reference
npx tsx tools/validate-bundle-size.ts \
  apps/pokehub-app/statoscope-stats-client.json \
  --reference path/to/reference-stats.json

# Run statoscope diff validation (requires reference)
npx @statoscope/cli validate \
  --input apps/pokehub-app/statoscope-stats-client.json \
  --reference path/to/reference-stats.json
```

### Viewing Bundle Analysis

After building with `ANALYZE=true`, open the generated HTML reports:

```bash
# Client bundle analysis
open apps/pokehub-app/statoscope-report-client.html

# Server bundle analysis
open apps/pokehub-app/statoscope-report-server.html
```

These reports show:

- Bundle composition and sizes
- Duplicate packages
- Module dependencies
- Comparison with reference (if provided)

## Configuration Files

| File                                    | Purpose                                        |
| --------------------------------------- | ---------------------------------------------- |
| `statoscope.config.js`                  | Statoscope diff rules and thresholds           |
| `tools/validate-bundle-size.ts`         | Accurate per-route size validation              |
| `.github/bundle-reviewers.yml`          | Authorized approvers list                      |
| `.github/workflows/ci.yml`              | Main CI workflow with validation steps         |
| `.github/workflows/bundle-approval.yml` | Handles approval comments                      |

## Troubleshooting

### "reference-stats is not specified"

This warning appears when there's no main branch baseline to compare against. This happens on:

- First PR after enabling bundle validation
- PRs to a branch that hasn't had a successful main build yet

The validation still runs absolute limit checks.

### Validation fails but I only see warnings

The failure detection uses the Statoscope CLI exit code. If you see "0 errors, X warnings", the validation actually passed. Check:

- The CI logs for the actual error
- That the stats file was generated correctly

### Approval not working

1. **Check username** - GitHub usernames are case-sensitive in some contexts. Ensure the username in `bundle-reviewers.yml` matches exactly.
2. **Check timing** - Approvals must be made after the last commit. Push a new commit = need new approval.
3. **Check comment format** - Must start with `/approve-bundle-size` (no leading spaces).

### Bundle size increased unexpectedly

Use the Statoscope HTML report to investigate:

1. Download the `bundle-stats-pr-{number}` artifact from GitHub Actions
2. Run `npx @statoscope/cli generate` to create an HTML report
3. Look for:
   - New dependencies
   - Duplicate packages
   - Large modules that could be lazy-loaded

## Best Practices

### Keeping Bundle Size Down

1. **Lazy load routes** - Use Next.js dynamic imports for non-critical pages
2. **Tree shake** - Ensure dependencies support tree shaking
3. **Deduplicate packages** - Fix duplicate package warnings
4. **Review dependencies** - Check bundle impact before adding new packages

### When to Approve Increases

Approve bundle increases when:

- Adding a new feature that justifies the size
- The increase is temporary (follow-up PR will optimize)
- Alternative approaches were considered and rejected

Include context in the approval reason:

```
/approve-bundle-size adding date-fns for calendar feature, evaluated moment.js (larger) and native Date (insufficient)
```

### Monitoring Over Time

- Bundle stats are retained for 90 days on main branch
- Track First Load JS trends over releases
- Set up alerts if bundle size grows consistently
