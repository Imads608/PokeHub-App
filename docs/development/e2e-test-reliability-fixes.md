# E2E Test Reliability Fixes

## Table of Contents

- [Overview](#overview)
- [Summary of Issues and Fixes](#summary-of-issues-and-fixes)
  - [1. Browser Selection in CI](#1-browser-selection-in-ci)
  - [2. Parallel Worker Configuration](#2-parallel-worker-configuration)
  - [3. CI-Specific Timeouts](#3-ci-specific-timeouts)
  - [4. Fragile Text-Based Selectors](#4-fragile-text-based-selectors)
  - [5. Combobox Component data-testid Support](#5-combobox-component-data-testid-support)
  - [6. Lazy-Loaded Component Handling](#6-lazy-loaded-component-handling)
  - [7. Page Load Stability](#7-page-load-stability)
  - [8. Artifact Upload Path Fix](#8-artifact-upload-path-fix)
- [Test Reliability Best Practices](#test-reliability-best-practices)
  - [✅ DO](#-do)
  - [❌ DON'T](#-dont)
- [Performance Improvements Summary](#performance-improvements-summary)
- [Files Modified](#files-modified)
  - [CI/CD Configuration](#cicd-configuration)
  - [Playwright Configuration](#playwright-configuration)
  - [Components (Added test IDs)](#components-added-test-ids)
  - [Tests (Updated selectors and waits)](#tests-updated-selectors-and-waits)
- [Testing](#testing)
  - [Run E2E Tests Locally](#run-e2e-tests-locally)
  - [View Test Reports](#view-test-reports)
- [Troubleshooting](#troubleshooting)
  - [Tests Pass Locally but Fail in CI](#tests-pass-locally-but-fail-in-ci)
  - [Flaky Tests (Pass/Fail Randomly)](#flaky-tests-passfail-randomly)
  - [Element Not Found Errors](#element-not-found-errors)
- [Maintenance](#maintenance)
- [References](#references)

---

## Overview

This document details the fixes applied to make E2E tests reliable and consistent across both local and CI environments. The tests were experiencing flakiness and failures in CI due to timing issues, lazy-loaded components, and selector fragility.

## Summary of Issues and Fixes

### 1. Browser Selection in CI

**Issue:** Tests were running against all 3 browsers (Chromium, Firefox, WebKit) in CI, causing long execution times.

**Fix:** Updated CI workflow to run only Chromium tests.

```yaml
# .github/workflows/ci.yml
- name: Run frontend Playwright E2E tests
  if: needs.setup.outputs.has-app-changes == 'true'
  run: npx nx e2e pokehub-app-e2e -- --project=chromium
```

**Note:** Added `--` before `--project=chromium` to properly pass the flag to Playwright through Nx.

**Impact:** 3x faster E2E test execution in CI.

---

### 2. Parallel Worker Configuration

**Issue:** CI was defaulting to 1 worker for stability, causing sequential test execution.

**Fix:** Configured Playwright to use 2 workers in CI to utilize both CPU cores.

```typescript
// apps/pokehub-app-e2e/playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 2 : undefined,
  // ...
});
```

**Impact:** 2x faster test execution in CI by running tests in parallel.

---

### 3. CI-Specific Timeouts

**Issue:** CI environment is slower than local (cold start, no cache, network latency), causing timeout failures.

**Fix:** Added longer timeouts for CI environment.

```typescript
// apps/pokehub-app-e2e/playwright.config.ts
export default defineConfig({
  timeout: process.env.CI ? 60000 : 30000, // Test timeout
  expect: {
    timeout: process.env.CI ? 10000 : 5000, // Assertion timeout
  },
  // ...
});
```

**Impact:**

- Tests have 60s to complete in CI vs 30s locally
- Assertions wait up to 10s in CI vs 5s locally

---

### 4. Fragile Text-Based Selectors

**Issue:** Tests using `getByText()` and `getByPlaceholder()` were brittle and failed when UI text changed or elements loaded slowly.

**Example Failures:**

```typescript
// FRAGILE ❌
await page.getByText('Add Pokémon').first().click();
await expect(page.getByPlaceholder(/search/i)).toBeVisible();
```

**Fix:** Added `data-testid` attributes to components and updated tests to use them.

**Components Updated:**

1. **Empty Slot (Add Pokemon button)**

   ```tsx
   // packages/frontend/pokehub-team-builder/src/lib/team-editor/empty-slot.tsx
   <Card data-testid={`add-pokemon-slot-${index}`}>
   ```

2. **Pokemon Selector Dialog**

   ```tsx
   // packages/frontend/pokehub-team-builder/src/lib/team-editor/team-editor.tsx
   <DialogContent data-testid="pokemon-selector-dialog">
   ```

3. **Pokemon Search Input**

   ```tsx
   // packages/frontend/pokehub-team-builder/src/lib/team-editor/pokemon-selector/pokemon-selector.tsx
   <Input data-testid="pokemon-search-input" />
   ```

4. **Format Selector**

   ```tsx
   // packages/frontend/pokehub-team-builder/src/lib/team-editor/team-configuration/format-selector.tsx
   <Combobox data-testid="format-selector" />
   ```

5. **Format Rules Card**
   ```tsx
   // packages/frontend/pokehub-team-builder/src/lib/team-editor/team-configuration/format-rules-display.tsx
   <Card data-testid="format-rules-card">
   ```

**Tests Updated:**

```typescript
// RELIABLE ✅
await page.getByTestId('add-pokemon-slot-0').click();
await expect(page.getByTestId('pokemon-search-input')).toBeVisible();
```

**Impact:** Tests are now immune to UI text changes and more reliable.

---

### 5. Combobox Component `data-testid` Support

**Issue:** The Format Selector component passed `data-testid` to the Combobox component, but Combobox didn't forward it to the rendered element.

**Fix:** Enhanced Combobox component to accept and forward `data-testid` prop.

```typescript
// packages/frontend/shared-ui-components/src/lib/combobox/combobox.tsx

// 1. Added to interface
export interface ComboboxProps {
  // ... other props
  'data-testid'?: string;
}

// 2. Destructured from props
export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      // ... other props
      'data-testid': dataTestId,
    },
    ref
  ) => {
    // ...
  }
);

// 3. Applied to trigger button
<Button
  ref={ref}
  id={id}
  data-testid={dataTestId}
  // ... other props
>
```

**Impact:** Format selector tests now work reliably with `getByTestId('format-selector')`.

---

### 6. Lazy-Loaded Component Handling

**Issue:** Pokemon Selector component is lazy-loaded with Suspense. Tests were failing because they didn't wait for the component to finish loading.

**Initial Approach (FAILED):**

```typescript
// ❌ This failed in CI
await expect(page.getByText('Loading Pokémon list...')).toBeHidden({
  timeout: 10000,
});
```

**Why it failed:**

- In CI, the lazy component gets stuck loading or loads very slowly
- The loading text stays visible for the entire timeout period
- Test times out waiting for loading to disappear

**Final Fix:**

```typescript
// ✅ Wait directly for the element we need
await expect(page.getByTestId('pokemon-search-input')).toBeVisible({
  timeout: 15000,
});
```

**Why this works:**

- Waits for what we actually need (the search input)
- 15-second timeout accommodates slow CI environment
- Works whether component loads in 1s or 14s
- No dependency on loading state visibility

**Files Updated:**

- `apps/pokehub-app-e2e/src/team-editor-simple.spec.ts`
- `apps/pokehub-app-e2e/src/team-editor.spec.ts`

---

### 7. Page Load Stability

**Issue:** Tests were checking for elements before the page fully loaded, especially with lazy-loaded components.

**Fix:** Added explicit waits for page-level indicators before checking individual elements.

```typescript
// Wait for page to be fully loaded
await expect(page.getByRole('heading', { name: 'Team Builder' })).toBeVisible();

// Then check for components
await expect(page.getByTestId('format-selector')).toBeVisible();
```

**Impact:** Reduced race conditions where tests ran before page was ready.

---

### 8. Artifact Upload Path Fix

**Issue:** CI wasn't uploading Playwright failure artifacts because the path was incorrect.

**Before:**

```yaml
path: dist/.playwright/
```

**After:**

```yaml
path: |
  dist/.playwright/apps/pokehub-app-e2e/playwright-report/
  dist/.playwright/apps/pokehub-app-e2e/test-output/
```

**Additional Improvements:**

- Added step ID to track test failure: `id: e2e-frontend`
- Only upload on actual test failure: `if: always() && steps.e2e-frontend.outcome == 'failure'`
- Added run number to artifact name: `name: playwright-report-${{ github.run_number }}`
- Added warning for missing files: `if-no-files-found: warn`

**Impact:** CI now properly uploads screenshots, traces, and HTML reports on test failures.

---

## Test Reliability Best Practices

Based on these fixes, follow these patterns for reliable E2E tests:

### ✅ DO:

1. **Use `data-testid` for interactive elements**

   ```typescript
   await page.getByTestId('submit-button').click();
   ```

2. **Wait for lazy-loaded content with generous timeouts**

   ```typescript
   await expect(page.getByTestId('lazy-component')).toBeVisible({
     timeout: 15000,
   });
   ```

3. **Wait for page-level indicators before checking details**

   ```typescript
   await expect(page.getByRole('heading')).toBeVisible();
   await expect(page.getByTestId('detail-element')).toBeVisible();
   ```

4. **Use specific selectors over generic ones**

   ```typescript
   // Good
   await page.getByTestId('add-pokemon-slot-0').click();
   
   // Avoid
   await page.getByText('Add Pokémon').first().click();
   ```

### ❌ DON'T:

1. **Don't rely on loading states disappearing**

   ```typescript
   // Bad - loading might get stuck
   await expect(page.getByText('Loading...')).toBeHidden();
   
   // Good - wait for actual content
   await expect(page.getByTestId('content')).toBeVisible({ timeout: 15000 });
   ```

2. **Don't use `.first()` on ambiguous selectors**

   ```typescript
   // Bad - which button?
   await page.getByRole('button').first().click();
   
   // Good - specific element
   await page.getByTestId('submit-button').click();
   ```

3. **Don't use short timeouts for lazy-loaded content**

   ```typescript
   // Bad - might timeout in CI
   await expect(lazyElement).toBeVisible({ timeout: 5000 });
   
   // Good - generous timeout for CI
   await expect(lazyElement).toBeVisible({ timeout: 15000 });
   ```

---

## Performance Improvements Summary

| Improvement             | Impact                     |
| ----------------------- | -------------------------- |
| Run only Chromium in CI | **3x faster**              |
| Use 2 workers in CI     | **2x faster**              |
| **Combined**            | **~4-5x faster E2E tests** |

**Before:** ~45-60 seconds for E2E tests (all browsers, 1 worker)  
**After:** ~10-15 seconds for E2E tests (Chromium only, 2 workers)

---

## Files Modified

### CI/CD Configuration

- `.github/workflows/ci.yml` - Browser selection, artifact upload

### Playwright Configuration

- `apps/pokehub-app-e2e/playwright.config.ts` - Workers, timeouts

### Components (Added test IDs)

- `packages/frontend/pokehub-team-builder/src/lib/team-editor/empty-slot.tsx`
- `packages/frontend/pokehub-team-builder/src/lib/team-editor/team-editor.tsx`
- `packages/frontend/pokehub-team-builder/src/lib/team-editor/pokemon-selector/pokemon-selector.tsx`
- `packages/frontend/pokehub-team-builder/src/lib/team-editor/team-configuration/format-selector.tsx`
- `packages/frontend/pokehub-team-builder/src/lib/team-editor/team-configuration/format-rules-display.tsx`
- `packages/frontend/shared-ui-components/src/lib/combobox/combobox.tsx`

### Tests (Updated selectors and waits)

- `apps/pokehub-app-e2e/src/team-editor-simple.spec.ts`
- `apps/pokehub-app-e2e/src/team-editor.spec.ts`

---

## Testing

### Run E2E Tests Locally

```bash
# Run all tests
npx nx e2e pokehub-app-e2e

# Run only Chromium (like CI)
npx nx e2e pokehub-app-e2e -- --project=chromium

# Run with UI mode for debugging
npx nx e2e pokehub-app-e2e -- --ui
```

### View Test Reports

```bash
# After test run, view HTML report
npx playwright show-report dist/.playwright/apps/pokehub-app-e2e/playwright-report

# View trace for a specific test
npx playwright show-trace dist/.playwright/apps/pokehub-app-e2e/test-output/<test-name>/trace.zip
```

---

## Troubleshooting

### Tests Pass Locally but Fail in CI

**Likely causes:**

1. Timeouts too short for CI environment
2. Component lazy-loading slower in CI
3. Network requests timing out

**Solutions:**

1. Increase timeout: `await expect(element).toBeVisible({ timeout: 15000 })`
2. Wait for actual content, not loading states
3. Check CI logs for network errors

### Flaky Tests (Pass/Fail Randomly)

**Likely causes:**

1. Race conditions - checking elements before they're ready
2. Parallel test conflicts
3. Non-deterministic component behavior

**Solutions:**

1. Add explicit waits for page load indicators
2. Use unique `data-testid` values
3. Ensure tests are isolated (don't share state)

### Element Not Found Errors

**Check:**

1. Is the `data-testid` correctly applied in the component?
2. Does the component forward `data-testid` to a DOM element?
3. Is the element in a lazy-loaded component? (needs longer timeout)
4. Is the element conditionally rendered? (wait for condition first)

---

## Maintenance

When adding new E2E tests:

1. ✅ **Add `data-testid`** to new interactive elements
2. ✅ **Use generous timeouts** (15s) for lazy-loaded content
3. ✅ **Wait for page indicators** before detailed assertions
4. ✅ **Test locally AND in CI** before merging
5. ✅ **Check Playwright report** on failures to understand timing issues

---

## References

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Timeouts](https://playwright.dev/docs/test-timeouts)
- [Frontend E2E Testing Guide](./frontend-e2e-testing.md)
- [Backend E2E Testing Guide](./backend-e2e-testing.md)
- [Unit & Integration Testing Guide](./unit-integration-testing.md)
