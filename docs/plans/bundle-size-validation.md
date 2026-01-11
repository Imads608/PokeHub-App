# Plan: Bundle Size Validation with First Load JS Limits

## Goal

Enforce bundle size checks in PR builds using Statoscope, specifically targeting **First Load JS** (initial chunks only), with comparison against main branch.

## Key Distinction: First Load JS vs Total Download Size

| Metric           | What it measures             | Statoscope option   |
| ---------------- | ---------------------------- | ------------------- |
| `maxSize`        | All chunks (initial + async) | Total download size |
| `maxInitialSize` | Initial chunks only          | **First Load JS** ✓ |
| `maxAsyncSize`   | Async/lazy-loaded chunks     | On-demand code      |

**First Load JS** = `maxInitialSize` - This is what Next.js reports in build output.

---

## Files to Modify

1. **`.github/workflows/ci.yml`** - Add artifact upload/download and validation step
2. **`.github/workflows/bundle-approval.yml`** - New workflow for handling approval comments
3. **`.github/bundle-reviewers.yml`** - Configuration file for approved reviewers
4. **`statoscope.config.js`** - Use `maxInitialSize` for First Load JS limits
5. **`apps/pokehub-app/next.config.js`** - Already updated with `compressor: 'gzip'`

---

## Implementation Steps

### Step 1: Update `statoscope.config.js`

Use `maxInitialSize` instead of `maxSize` to validate First Load JS:

```js
module.exports = {
  validate: {
    plugins: ['@statoscope/webpack'],
    reporters: ['@statoscope/console'],
    rules: {
      // First Load JS limits (gzipped, initial chunks only)
      '@statoscope/webpack/entry-download-size-limits': [
        'error',
        { global: { maxInitialSize: 500 * 1024 } }, // 500KB default
      ],

      // Fail PR if First Load JS increases by more than 10KB vs main
      '@statoscope/webpack/diff-entry-download-size-limits': [
        'error',
        { global: { maxInitialSizeDiff: 10 * 1024 } },
      ],

      // Warn on duplicate packages
      '@statoscope/webpack/no-packages-dups': ['warn'],

      // Build time limit (5 minutes)
      '@statoscope/webpack/build-time-limits': ['error', 300000],
    },
  },
};
```

### Step 2: Create Approved Reviewers Config (`.github/bundle-reviewers.yml`)

```yaml
# Users authorized to approve bundle size increases
# These users can comment "/approve-bundle-size <reason>" to bypass the check
approvers:
  - imad
  # Add other authorized usernames here
```

### Step 3: Update CI Workflow (`.github/workflows/ci.yml`)

Add to the `build` job:

```yaml
# After building affected projects...

# Upload stats as artifact (main branch only)
- name: Upload bundle stats
  if: github.ref == 'refs/heads/main' && needs.setup.outputs.has-app-changes == 'true'
  uses: actions/upload-artifact@v4
  with:
    name: bundle-stats-main
    path: apps/pokehub-app/statoscope-stats-client.json
    overwrite: true
    retention-days: 90

# Download main branch stats (PRs only)
- name: Download main branch stats
  if: github.event_name == 'pull_request' && needs.setup.outputs.has-app-changes == 'true'
  continue-on-error: true
  run: |
    gh run download \
      --repo ${{ github.repository }} \
      --branch main \
      --name bundle-stats-main \
      --dir ./main-stats || echo "No main branch stats found"
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

# Validate bundle size
- name: Validate bundle size
  if: needs.setup.outputs.has-app-changes == 'true'
  id: validate
  continue-on-error: true
  run: |
    if [ -f ./main-stats/statoscope-stats-client.json ]; then
      echo "Comparing against main branch..."
      OUTPUT=$(npx @statoscope/cli validate \
        --input apps/pokehub-app/statoscope-stats-client.json \
        --reference ./main-stats/statoscope-stats-client.json 2>&1) || true
    else
      echo "No main branch reference, validating absolute limits only..."
      OUTPUT=$(npx @statoscope/cli validate \
        --input apps/pokehub-app/statoscope-stats-client.json 2>&1) || true
    fi

    echo "$OUTPUT"
    echo "output<<EOF" >> $GITHUB_OUTPUT
    echo "$OUTPUT" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT

    if echo "$OUTPUT" | grep -q "error"; then
      echo "failed=true" >> $GITHUB_OUTPUT
      exit 1
    else
      echo "failed=false" >> $GITHUB_OUTPUT
    fi

# Check for existing approval comment
- name: Check for bundle size approval
  if: steps.validate.outputs.failed == 'true' && github.event_name == 'pull_request'
  id: check-approval
  run: |
    # Load approved users from config
    APPROVED_USERS=$(yq '.approvers | join(",")' .github/bundle-reviewers.yml)
    echo "Approved users: $APPROVED_USERS"

    # Check for approval comment from authorized user
    COMMENTS=$(gh pr view ${{ github.event.pull_request.number }} \
      --json comments \
      --jq '.comments[] | select(.body | startswith("/approve-bundle-size")) | {author: .author.login, body: .body}')

    if [ -n "$COMMENTS" ]; then
      echo "$COMMENTS" | while read -r comment; do
        APPROVER=$(echo "$comment" | jq -r '.author')
        if echo ",$APPROVED_USERS," | grep -q ",$APPROVER,"; then
          REASON=$(echo "$comment" | jq -r '.body' | sed 's|/approve-bundle-size||' | xargs)
          echo "✅ Bundle size approved by: $APPROVER"
          echo "Reason: $REASON"
          echo "approved=true" >> $GITHUB_OUTPUT
          exit 0
        fi
      done
    fi

    echo "approved=false" >> $GITHUB_OUTPUT
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

# Post approval instructions if validation failed and no approval found
- name: Post approval instructions
  if: steps.validate.outputs.failed == 'true' && steps.check-approval.outputs.approved != 'true' && github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const yaml = require('js-yaml');

      // Load approved users from config
      let approvedUsers = [];
      try {
        const config = yaml.load(fs.readFileSync('.github/bundle-reviewers.yml', 'utf8'));
        approvedUsers = config.approvers || [];
      } catch (e) {
        console.log('Could not load bundle-reviewers.yml:', e);
        approvedUsers = ['imad']; // fallback
      }

      const body = `## ⚠️ Bundle Size Validation Failed

The bundle size has increased beyond the allowed threshold.

<details>
<summary>Validation Output</summary>

\`\`\`
${{ steps.validate.outputs.output }}
\`\`\`

</details>

### To approve this increase

An authorized reviewer must comment:
\`\`\`
/approve-bundle-size <reason>
\`\`\`

**Authorized reviewers:** ${approvedUsers.map(u => '@' + u).join(', ')}

After approval, re-run this workflow.`;

      // Check if we already posted this comment
      const comments = await github.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
      });

      const existingComment = comments.data.find(c =>
        c.user.login === 'github-actions[bot]' &&
        c.body.includes('Bundle Size Validation Failed')
      );

      if (existingComment) {
        await github.rest.issues.updateComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          comment_id: existingComment.id,
          body: body
        });
      } else {
        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: context.issue.number,
          body: body
        });
      }

# Fail if not approved
- name: Fail if bundle size not approved
  if: steps.validate.outputs.failed == 'true' && steps.check-approval.outputs.approved != 'true'
  run: |
    echo "❌ Bundle size validation failed and no approval found."
    echo "An authorized reviewer must comment '/approve-bundle-size <reason>' to approve."
    exit 1
```

### Step 4: Create Bundle Approval Workflow (`.github/workflows/bundle-approval.yml`)

This workflow triggers when an authorized user comments `/approve-bundle-size` and automatically re-runs the CI:

```yaml
name: Bundle Size Approval

on:
  issue_comment:
    types: [created]

jobs:
  handle-approval:
    # Only run on PR comments that start with /approve-bundle-size
    if: |
      github.event.issue.pull_request &&
      startsWith(github.event.comment.body, '/approve-bundle-size')
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Verify approver is authorized
        id: verify
        run: |
          # Load approved users from config
          APPROVED_USERS=$(yq '.approvers | join(",")' .github/bundle-reviewers.yml)
          COMMENTER="${{ github.event.comment.user.login }}"

          echo "Commenter: $COMMENTER"
          echo "Approved users: $APPROVED_USERS"

          if echo ",$APPROVED_USERS," | grep -q ",$COMMENTER,"; then
            echo "✅ Valid approval from: $COMMENTER"
            echo "valid=true" >> $GITHUB_OUTPUT
          else
            echo "❌ $COMMENTER is not authorized to approve bundle size increases"
            echo "valid=false" >> $GITHUB_OUTPUT
          fi

      - name: Add reaction and trigger re-run
        if: steps.verify.outputs.valid == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            // Add rocket reaction to approval comment
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: 'rocket'
            });

            // Get the PR details
            const pr = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number
            });

            // Find the most recent CI workflow run for this PR
            const runs = await github.rest.actions.listWorkflowRunsForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              head_sha: pr.data.head.sha,
            });

            // Find the CI workflow run (adjust name if different)
            const ciRun = runs.data.workflow_runs.find(r => 
              r.name === 'CI' && (r.conclusion === 'failure' || r.status === 'completed')
            );

            if (ciRun) {
              console.log(`Re-running workflow: ${ciRun.id}`);
              await github.rest.actions.reRunWorkflow({
                owner: context.repo.owner,
                repo: context.repo.repo,
                run_id: ciRun.id
              });
              
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: `🔄 Bundle size increase approved by @${context.payload.comment.user.login}. Re-running CI workflow...`
              });
            } else {
              console.log('No failed CI run found to re-run');
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: `✅ Bundle size increase approved by @${context.payload.comment.user.login}. Please re-run the CI workflow manually.`
              });
            }

      - name: Reject unauthorized approval
        if: steps.verify.outputs.valid != 'true'
        uses: actions/github-script@v7
        with:
          script: |
            // Add confused reaction to unauthorized comment
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: 'confused'
            });

            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `❌ @${{ github.event.comment.user.login }} is not authorized to approve bundle size increases. See \`.github/bundle-reviewers.yml\` for the list of authorized reviewers.`
            });
```

---

## Approval Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PR Created/Updated                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CI Workflow Runs Build                               │
│                    (uploads bundle stats as artifact)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Bundle Validation Step Runs                             │
│              (compares PR stats against main branch stats)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │                                 │
                      ▼                                 ▼
               ┌─────────────┐                  ┌─────────────┐
               │  ✅ Passed   │                  │  ❌ Failed   │
               └─────────────┘                  └─────────────┘
                      │                                 │
                      ▼                                 ▼
               ┌─────────────┐      ┌─────────────────────────────────────────┐
               │    Done     │      │   Check for existing /approve-bundle-size│
               └─────────────┘      │   comment from an approved user          │
                                    └─────────────────────────────────────────┘
                                                       │
                                       ┌───────────────┴───────────────┐
                                       │                               │
                                       ▼                               ▼
                              ┌──────────────┐                ┌──────────────┐
                              │ Found valid  │                │  Not found   │
                              │   approval   │                │              │
                              └──────────────┘                └──────────────┘
                                       │                               │
                                       ▼                               ▼
                              ┌──────────────┐      ┌──────────────────────────┐
                              │  ✅ Pass job  │      │  Post comment explaining │
                              └──────────────┘      │  failure + how to approve│
                                                    └──────────────────────────┘
                                                               │
                                                               ▼
                                                    ┌──────────────────────────┐
                                                    │      ❌ Fail job          │
                                                    └──────────────────────────┘
                                                               │
                                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Approved User Sees Failure                               │
│                                                                              │
│  "Bundle size increased by 15KB. To approve, comment:                        │
│   /approve-bundle-size <reason>                                              │
│                                                                              │
│   Authorized: @imad, @alice, @bob"                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│            Approved User Comments: /approve-bundle-size adding charts lib    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  bundle-approval.yml Workflow Triggers                       │
│                      (on: issue_comment created)                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Verify commenter is authorized                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │                                 │
                      ▼                                 ▼
             ┌────────────────┐                ┌────────────────┐
             │  ✅ Authorized  │                │ ❌ Unauthorized │
             └────────────────┘                └────────────────┘
                      │                                 │
                      ▼                                 ▼
       ┌──────────────────────────┐         ┌──────────────────────────┐
       │ 1. Add 🚀 reaction        │         │ 1. Add 😕 reaction        │
       │ 2. Re-run CI workflow    │         │ 2. Post "not authorized" │
       └──────────────────────────┘         └──────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CI Workflow Re-runs                                  │
│            (this time finds the approval comment → passes)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                      │
                      ▼
             ┌────────────────┐
             │    ✅ Done      │
             └────────────────┘
```

---

## PR Timeline Example

```
┌─ PR #123: Add interactive charts feature ─────────────────────────────────┐
│                                                                            │
│  🔴 CI failed                                              2 minutes ago   │
│                                                                            │
│  🤖 github-actions (bot)                                   2 minutes ago   │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Bundle Size Validation Failed                                    │   │
│  │                                                                     │   │
│  │ First Load JS increased by 15KB (threshold: 10KB)                  │   │
│  │                                                                     │   │
│  │ To approve, an authorized reviewer must comment:                   │   │
│  │ /approve-bundle-size <reason>                                      │   │
│  │                                                                     │   │
│  │ Authorized: @imad                                                  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  👤 imad                                                   1 minute ago    │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ /approve-bundle-size adding recharts library for analytics  🚀     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  🤖 github-actions (bot)                                   1 minute ago    │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ 🔄 Bundle size increase approved by @imad. Re-running CI...        │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  🟢 CI passed                                              just now        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Validation Behavior

| Scenario                           | What happens                               |
| ---------------------------------- | ------------------------------------------ |
| PR build (main stats exist)        | Validates absolute limits + diff vs main   |
| PR build (no main stats)           | Validates absolute limits only             |
| Main branch build                  | Validates absolute limits + uploads stats  |
| First run after setup              | Gracefully skips diff validation           |
| Validation fails, no approval      | Posts comment with instructions, job fails |
| Validation fails, has approval     | Logs approval, job passes                  |
| Unauthorized user tries to approve | Confused reaction, rejection comment       |

---

## Testing the Setup

After implementation, run locally:

```bash
ANALYZE=true nx build pokehub-app
npx @statoscope/cli validate --input apps/pokehub-app/statoscope-stats-client.json
```

---

## Verified Statoscope Options

Confirmed from [official docs](https://github.com/statoscope/statoscope/blob/master/packages/stats-validator-plugin-webpack/docs/rules/):

**Absolute limits:** `maxSize`, `maxInitialSize`, `maxAsyncSize`
**Diff limits:** `maxSizeDiff`, `maxInitialSizeDiff`, `maxAsyncSizeDiff`

Both support percentage-based limits: `{ type: 'percent', number: 10 }`

---

## Decisions

- **First Load JS limit:** 500KB (gzipped) default
- **Diff limit:** 10KB increase = error
- **Override mechanism:** Approved reviewers can comment `/approve-bundle-size <reason>`
- **Approved reviewers:** Configured in `.github/bundle-reviewers.yml`
- **Self-approval:** Allowed if the PR author is in the approved reviewers list
