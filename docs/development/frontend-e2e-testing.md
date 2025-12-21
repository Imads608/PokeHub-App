# Frontend E2E Testing Architecture

## Table of Contents

- [Current Status](#current-status)
- [Architecture Overview](#architecture-overview)
  - [The Solution: MSW Proxy Server](#the-solution-msw-proxy-server)
  - [Architecture Diagram](#architecture-diagram)
  - [Why This Architecture?](#why-this-architecture)
- [The Journey: Problems & Solutions](#the-journey-problems--solutions)
  - [Problem 1: Browser-Level Mocking Fails for SSR](#problem-1-browser-level-mocking-fails-for-ssr)
  - [Problem 2: In-Process MSW Server Doesn't Work](#problem-2-in-process-msw-server-doesnt-work)
  - [Problem 3: MSW Proxy + Auth Timeout](#problem-3-msw-proxy--auth-timeout)
  - [Solution: Selective Body Parsing + Pure Express Handlers](#solution-selective-body-parsing--pure-express-handlers)
- [Authentication Flow](#authentication-flow)
  - [Test Credentials Provider](#test-credentials-provider)
  - [Auth Flow Through Proxy](#auth-flow-through-proxy)
- [Files & Components](#files--components)
  - [MSW Proxy Server](#msw-proxy-server)
  - [Test Infrastructure](#test-infrastructure)
  - [Backend Support](#backend-support)
- [Test Execution](#test-execution)
  - [Running Tests](#running-tests)
  - [What Happens](#what-happens)
- [Current Test Coverage](#current-test-coverage)
- [Advantages of This Approach](#advantages-of-this-approach)
  - [Comparison with Alternatives](#comparison-with-alternatives)
- [Lessons Learned](#lessons-learned)
- [Security Considerations](#security-considerations)
- [Future Enhancements](#future-enhancements)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)
- [Related Documentation](#related-documentation)

---

## Current Status

**✅ WORKING** - MSW Proxy Solution Fully Functional

Frontend Playwright E2E tests are now **fully functional** using an MSW (Mock Service Worker) proxy server approach that successfully intercepts both client-side and server-side (SSR) API requests.

**Current Test Results:**

- ✅ **Frontend Playwright E2E Tests: 63/63 passing (100%)**
  - Team Editor: 44 tests
  - Create Profile: 19 tests
- ✅ Backend API E2E Tests: 70 tests passing
- ✅ Backend Unit Tests: 64 passing
- ✅ Frontend Unit Tests: 283+ passing
- ✅ Backend Integration Tests: 87 passing

---

## Architecture Overview

### The Solution: MSW Proxy Server

We use an Express-based proxy server that:

1. Runs on port 9876 during E2E tests
2. Mocks `/api/teams/*` endpoints with test data
3. Mocks `/api/users/:userId/profile` for avatar upload testing
4. Mocks `/mock-azure-upload` for simulating Azure blob storage
5. Forwards all other requests (auth, etc.) to the real backend (port 3000)
6. Works for BOTH client-side fetch AND Next.js Server Components (SSR)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     E2E Test Architecture                        │
│                                                                  │
│  Next.js Frontend (port 4200)                                   │
│         │                                                        │
│         │ API_URL=http://localhost:9876/api                     │
│         ↓                                                        │
│  MSW Proxy Server (port 9876)                                   │
│         │                                                        │
│         ├─→ /api/teams/*  ──→ Mocked responses (test data)     │
│         │                                                        │
│         ├─→ /api/users/*/profile ──→ Mocked profile updates    │
│         │                                                        │
│         ├─→ /mock-azure-upload ──→ Mocked blob storage         │
│         │                                                        │
│         └─→ /api/auth/*   ──→ Real Backend (port 3000)         │
│             /api/test/*        (authentication)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Problem:** Next.js Server Components make API calls server-side, which traditional browser-level mocking (like `page.route()`) cannot intercept.

**Solution:** Route ALL frontend API calls through a proxy server that we control, which can mock specific endpoints while forwarding others to the real backend.

---

## The Journey: Problems & Solutions

### Problem 1: Browser-Level Mocking Fails for SSR ❌

**Initial Approach:**

```typescript
// This works for client-side fetching
await page.route('**/api/teams/*', mockHandler);
```

**Why it failed:**

- Playwright's `page.route()` only intercepts requests from the **browser**
- Next.js Server Components make requests from the **Node.js server process**
- These server-side requests bypass browser mocking entirely

**Evidence:**

- 28 tests passing (client-side: creating teams, editing forms)
- 16 tests failing (server-side: loading existing teams from URL)

### Problem 2: In-Process MSW Server Doesn't Work ❌

**Second Approach:**

```typescript
// MSW Node server in test process
import { setupServer } from 'msw/node';

const server = setupServer(...handlers);
server.listen();
```

**Why it failed:**

- MSW Node server runs in the **Playwright test process**
- Next.js dev server is a **separate process**
- MSW cannot intercept requests between separate processes

### Problem 3: MSW Proxy + Auth Timeout ⚠️

**Third Approach:**

```typescript
// Express proxy with MSW middleware
app.use(express.json()); // Global body parser
app.use(createMiddleware(...handlers));
app.use('/', proxyMiddleware);
```

**Why it failed:**

- Global `express.json()` consumed request bodies
- Proxy middleware received empty body streams
- Auth requests (`POST /api/test/auth/create-session`) timed out
- Frontend couldn't authenticate

**Error:**

```
Failed to set up authentication: apiRequestContext.post: Timeout 30000ms exceeded.
Call log:
  - → POST http://127.0.0.1:4200/api/auth/callback/test-credentials
```

### Solution: Selective Body Parsing + Pure Express Handlers

**Final Working Approach:**

```typescript
// apps/pokehub-app-e2e/src/mocks/proxy-server.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Health check (for Playwright startup verification)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', proxy: 'msw' });
});

// Mock team endpoints with pure Express handlers
app.get('/api/teams/:id', (req, res) => {
  // Return mocked team data
});

app.post('/api/teams', express.json(), (req, res) => {
  // Only parse JSON for routes that need it
});

// Forward everything else to real backend
app.use(
  '/',
  createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
  })
);

app.listen(9876);
```

**Key insights:**

1. **No global body parser** - Let proxy handle raw streams
2. **Selective parsing** - Only parse JSON for specific mock routes that need it
3. **Pure Express handlers** - Simpler than MSW middleware, more control
4. **Explicit proxying** - Catch-all proxy forwards unhandled requests

**Configuration: Frontend Routes Through Proxy**

```typescript
// apps/pokehub-app-e2e/playwright.config.ts
webServer: [
  {
    // Real backend
    command: 'E2E_TESTING=true npx nx serve pokehub-api',
    url: 'http://127.0.0.1:3000/api/health',
  },
  {
    // MSW proxy
    command: 'npx tsx src/mocks/proxy-server.ts',
    url: 'http://127.0.0.1:9876/health',
  },
  {
    // Frontend with API_URL pointing to proxy
    command: 'E2E_TESTING=true API_URL=http://localhost:9876/api npx nx serve pokehub-app',
    url: 'http://127.0.0.1:4200',
  },
],
```

**The magic:** `API_URL=http://localhost:9876/api` makes ALL frontend API calls (both client and server-side) go through our proxy!

---

## Authentication Flow

### Test Credentials Provider

We use a custom NextAuth credentials provider that only works in test mode:

```typescript
// packages/frontend/shared-auth/src/lib/test-provider.ts
export const getTestCredentialsProvider = () => {
  if (process.env.E2E_TESTING !== 'true') {
    return null; // Disabled in production
  }

  return Credentials({
    id: 'test-credentials',
    async authorize(credentials) {
      // Call backend test endpoint through proxy
      const response = await getFetchClient('API').fetchApi(
        '/test/auth/create-session',
        { method: 'POST', body: JSON.stringify(credentials) }
      );
      return response.json();
    },
  });
};
```

### Auth Flow Through Proxy

```
1. Playwright global-setup calls frontend auth endpoint
   → POST http://127.0.0.1:4200/api/auth/callback/test-credentials

2. NextAuth processes credentials provider
   → Calls getFetchClient('API').fetchApi('/test/auth/create-session')
   → API_URL=http://localhost:9876/api
   → POST http://localhost:9876/api/test/auth/create-session

3. MSW Proxy receives request
   → No handler for /api/test/auth/create-session
   → Forwards to real backend: http://localhost:3000/api/test/auth/create-session

4. Real backend creates user and returns tokens ✅

5. NextAuth creates session ✅

6. Tests run with authenticated session ✅
```

**Key insight:** Auth requests transparently proxy through to the real backend, so authentication works exactly as in production!

---

## Parallel Test Execution Strategy

### The Challenge

Create-profile tests present a unique challenge: submission tests modify user state (setting username), which could cause conflicts if multiple tests share the same user. However, we want tests to run in parallel for speed.

### The Solution: Hybrid Auth Approach

We use two different authentication strategies based on test type:

#### 1. Read-Only Tests → Shared Auth State

Tests that only read data (validation, rendering, availability checks) share a pre-created auth state:

```typescript
test.describe('Create Profile Flow - New User', () => {
  test.use({
    storageState: path.join(__dirname, '../.auth/new-user.json'),
  });

  // These tests are safe to run in parallel because they don't modify state
  test('should show error for username too short', async ({ page }) => {
    await page.goto('/create-profile');
    await page.getByTestId('username-input').fill('ab');
    await expect(page.getByTestId('username-error')).toBeVisible();
  });
});
```

#### 2. Submission Tests → Unique User Per Test

Tests that submit the form create their own unique user:

```typescript
test.describe('Create Profile Flow - Form Submission', () => {
  // Clear storage state - each test authenticates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should submit profile successfully', async ({ page }) => {
    // Create unique user for this test
    await createAndAuthenticateUser(page);
    // ... test submission
  });
});
```

### The `createAndAuthenticateUser` Helper

This helper creates a unique user and authenticates via NextAuth:

```typescript
async function createAndAuthenticateUser(page: Page): Promise<string> {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `testuser-${uniqueId}@example.com`;

  // Get CSRF token (using page.request to share cookies)
  const csrfRes = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  // Authenticate via NextAuth test-credentials provider
  await page.request.post(`${BASE_URL}/api/auth/callback/test-credentials`, {
    form: { csrfToken, email },
  });

  // Navigate to create-profile to hydrate the session
  await page.goto('/create-profile');
  return email;
}
```

**Key insight:** Using `page.request` (not the standalone `request` fixture) ensures cookies are shared with the page context automatically.

### Benefits of This Approach

1. **Full parallel execution** - No serial mode needed
2. **Test isolation** - Submission tests don't interfere with each other
3. **Resource efficiency** - Read-only tests share auth state
4. **Realistic flow** - Each submission test exercises the full auth → profile creation flow

### Trade-offs

- **Test users accumulate** - Unique users are created but not deleted (no teardown)
- **Slightly slower submission tests** - Each creates its own user via API call
- **Database cleanup** - Periodic manual cleanup may be needed for long-running test environments

---

## Files & Components

### MSW Proxy Server

**`apps/pokehub-app-e2e/src/mocks/proxy-server.ts`**

- Express server on port 9876
- Mocks team CRUD endpoints
- Mocks profile update endpoint (`POST /api/users/:userId/profile`)
- Mocks Azure blob upload (`/mock-azure-upload`) with CORS support
- Forwards auth/test endpoints to real backend
- Health check for Playwright startup verification

**`apps/pokehub-app-e2e/src/mocks/handlers.ts`**

- Mock team data definition
- Exported for test file imports
- Contains `mockTeam` constant used by tests

**`apps/pokehub-app-e2e/src/mocks/fixtures/test-avatar.jpg`**

- Test image file for avatar upload tests
- Valid JPEG format required by upload validation

**`apps/pokehub-app-e2e/src/mocks/server.ts`**

- MSW Node server setup
- Currently unused (doesn't work for SSR)
- Kept for reference

### Test Infrastructure

**`apps/pokehub-app-e2e/src/global-setup.ts`**

- Waits for backend health (30 retries, 2s intervals)
- Waits for frontend readiness
- Authenticates via test-credentials provider
- Creates two auth states:
  - `.auth/user.json` - Existing user with username (for team tests)
  - `.auth/new-user.json` - New user without username (for create-profile tests)

**`apps/pokehub-app-e2e/playwright.config.ts`**

- Starts 3 servers: backend, proxy, frontend
- Sets `API_URL` environment variable
- Configures auth state persistence
- Screenshot on failure

**`apps/pokehub-app-e2e/src/team-editor.spec.ts`**

- E2E test cases for team builder
- Tests both client-side and server-side flows
- Uses real auth + mocked team data

**`apps/pokehub-app-e2e/src/create-profile.spec.ts`**

- E2E test cases for profile creation flow
- Uses parallel-safe approach with two auth strategies:
  - Read-only tests share `new-user.json` auth state
  - Submission tests create unique users via `createAndAuthenticateUser()` helper
- Tests route guards, validation, availability checks, avatar upload, and form submission

### Backend Support

**`apps/pokehub-api/src/test/test-auth.controller.ts`**

- `POST /api/test/auth/create-session`
- Creates test user in database
- Returns user data and tokens
- Only enabled when `E2E_TESTING=true`

**`packages/frontend/shared-auth/src/lib/test-provider.ts`**

- Custom NextAuth credentials provider
- Only registered when `E2E_TESTING=true`
- Calls backend test endpoint for auth

---

## Test Execution

### Running Tests

```bash
# Run all E2E tests
cd apps/pokehub-app-e2e
npx playwright test

# Run specific test file
npx playwright test team-editor.spec.ts
npx playwright test create-profile.spec.ts

# Run with specific filter
npx playwright test -g "should load existing team"
npx playwright test -g "should submit profile"

# Run with verbose server logs (shows backend/frontend/proxy output)
npx nx e2e:verbose pokehub-app-e2e

# Run in headed mode (see browser)
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Run only chromium
npx playwright test --project=chromium
```

### Verbose Mode for Debugging

The `e2e:verbose` target enables Playwright's webserver debug logging, which shows output from all three servers (backend, proxy, frontend):

```bash
# Run with verbose server logs
npx nx e2e:verbose pokehub-app-e2e

# Pass additional arguments (e.g., run specific test)
npx nx e2e:verbose pokehub-app-e2e -- --grep "should submit profile"
```

**Configuration (`apps/pokehub-app-e2e/project.json`):**

```json
{
  "e2e:verbose": {
    "executor": "nx:run-commands",
    "options": {
      "command": "DEBUG=pw:webserver nx e2e pokehub-app-e2e {args}",
      "forwardAllArgs": true
    }
  }
}
```

This is useful for debugging:

- Server startup issues
- Proxy request forwarding
- Authentication flow problems
- API response errors

### What Happens

1. **Playwright starts servers** (via `webServer` config):

   - Backend API on port 3000
   - MSW proxy on port 9876
   - Frontend on port 4200 (with `API_URL=http://localhost:9876/api`)

2. **Global setup runs**:

   - Waits for all servers to be healthy
   - Authenticates test user
   - Saves auth state

3. **Tests execute**:

   - Each test loads saved auth state
   - Makes API calls through proxy
   - Team endpoints return mock data
   - Auth endpoints proxy to real backend

4. **Cleanup**:
   - Playwright stops all servers
   - Test data remains in database (can be cleaned up)

---

## Current Test Coverage

**✅ 63/63 Chrome Tests Passing (100%)**

### Test Suites

#### Create Profile - New User Tests (15 tests)

The create-profile tests use a **parallel-safe approach** with two auth strategies:

1. **Read-only tests** use shared `new-user.json` auth state (user without username)
2. **Submission tests** create unique users per test via `createAndAuthenticateUser()` helper

##### Route Guards (2 tests)

- ✅ Redirect new user from dashboard to create-profile
- ✅ Allow new user to access create-profile directly

##### Form Rendering (1 test)

- ✅ Display all form elements (title, avatar upload, username input, submit button)

##### Username Validation (3 tests)

- ✅ Show error for username too short (< 3 chars)
- ✅ Show error for invalid characters
- ✅ Clear error when username becomes valid

##### Username Availability (2 tests)

- ✅ Show available indicator (green check) for available username
- ✅ Show taken indicator (red X) for existing username

##### Submit Button State (3 tests)

- ✅ Disable submit button when username is invalid
- ✅ Disable submit button when username is taken
- ✅ Enable submit button when username is valid and available

##### Avatar Upload (1 test)

- ✅ Update avatar preview when file is selected (blob URL)

##### Form Submission (4 tests) - Unique User Per Test

- ✅ Submit profile successfully without avatar
- ✅ Submit profile successfully with avatar
- ✅ Show loading state during submission ("Creating Profile...")
- ✅ Display user avatar in navigation after profile creation

#### Create Profile - Existing User Tests (2 tests)

- ✅ Redirect existing user away from create-profile
- ✅ Allow existing user to access dashboard directly

#### Team Editor - Authenticated Access (7 tests)

- ✅ Access team builder page when authenticated
- ✅ Show team configuration section
- ✅ Allow entering team name
- ✅ Show add Pokemon button
- ✅ Show save button

#### Team Editor - Team List (3 tests)

- ✅ Access team list page
- ✅ Show create new team button
- ✅ Navigate to builder when clicking create

#### Team Editor - Pokemon Selection (3 tests)

- ✅ Open Pokemon selector
- ✅ Pokemon selector has search
- ✅ Close Pokemon selector

#### Team Editor - Format Configuration (3 tests)

- ✅ Display format rules
- ✅ Show team analysis button
- ✅ Analyze button disabled for empty team

#### Team Editor - Export/Import (2 tests)

- ✅ Show export button
- ✅ Show import button

#### Team Editor - Generation Selection (2 tests)

- ✅ Have generation selector
- ✅ Open generation dropdown

#### Team Editor - URL Validation (3 tests)

- ✅ Handle invalid team ID gracefully (404)
- ✅ Accept "new" as valid team ID
- ✅ Accept valid UUID format

#### Team Editor - Team Creation Flow (4 tests)

- ✅ Create new team and add Pokemon (client-side)
- ✅ Open Pokemon selector
- ✅ Handle generation change with warning
- ✅ Validate team name is required

#### Team Editor - Team Editing Flow (4 tests)

- ✅ Load existing team for editing (SSR)
- ✅ Show 404 for non-existent team
- ✅ Allow editing team name
- ✅ Allow removing Pokemon from team

#### Team Editor - Validation Feedback (4 tests)

- ✅ Disable save button when validation fails
- ✅ Show validation errors for invalid team
- ✅ Show tooltip on disabled save button
- ✅ Prevent adding more than 6 Pokemon

#### Team Editor - Unsaved Changes (3 tests)

- ✅ Prompt when closing Pokemon editor with unsaved changes
- ✅ Allow closing Pokemon editor without changes
- ✅ Track changes for save button state

#### Team Editor - Navigation (3 tests)

- ✅ Navigate back to team list after saving
- ✅ Stay on edit page after updating
- ✅ Show team analysis dialog

#### Team Editor - Format Configuration (2 tests)

- ✅ Display format rules for selected format
- ✅ Update format rules when format changes

#### Team Editor - Export/Import (2 tests)

- ✅ Show export button
- ✅ Show import button

### Key Improvements Made

1. **Added Accessibility Attributes:**

   - `data-testid` for Pokemon cards and buttons
   - `aria-label` for icon-only buttons
   - Better semantic HTML usage

2. **Fixed Test Selectors:**

   - Use `getByRole()` instead of `getByText()` to avoid strict mode violations
   - Use `getByTestId()` for dynamic elements
   - Handle 404 pages properly with heading selectors

3. **Improved Test Reliability:**
   - Force hover for elements behind sticky navigation
   - Proper timeout handling
   - Better error checking for edge cases

---

## Advantages of This Approach

### ✅ Pros

1. **Works for SSR** - Intercepts Next.js server-side requests
2. **Real Authentication** - Uses actual backend auth, not mocked
3. **Selective Mocking** - Mock only what you need (team data)
4. **Independent Tests** - Tests don't affect real data
5. **Fast** - No network delays, instant mock responses
6. **Reliable** - No external dependencies (PokeAPI, etc.)
7. **Maintainable** - Single proxy server, easy to understand
8. **CI-Ready** - Works in GitHub Actions

### ⚠️ Cons

1. **Extra Server** - Requires running proxy server
2. **Port Management** - Need to coordinate 3 ports (3000, 4200, 9876)
3. **Mock Data Maintenance** - Must keep mock data in sync with schema
4. **Setup Complexity** - More moving parts than pure mocking

### Comparison with Alternatives

| Approach                 | SSR Support | Auth      | Maintenance | Reliability |
| ------------------------ | ----------- | --------- | ----------- | ----------- |
| **MSW Proxy (Current)**  | ✅ Yes      | ✅ Real   | ✅ Medium   | ✅✅ High   |
| Browser Mocking          | ❌ No       | ✅ Real   | ✅ Low      | ⚠️ Medium   |
| In-Process MSW           | ❌ No       | ✅ Real   | ✅ Low      | ⚠️ Medium   |
| Real Backend + Real Data | ✅ Yes      | ✅ Real   | ⚠️ High     | ✅✅ High   |
| Mock Everything          | ✅ Yes      | ❌ Mocked | ❌ High     | ❌ Low      |

---

## Lessons Learned

### 1. Browser Mocking Limitations

**Lesson:** Playwright's `page.route()` only works for client-side requests.

**Impact:** Can't test SSR data fetching with browser-level mocking.

**Solution:** Proxy server intercepts at network level, before client/server distinction.

### 2. Process Boundaries Matter

**Lesson:** MSW Node server cannot intercept requests between separate processes.

**Impact:** In-process MSW doesn't work when Next.js runs as separate dev server.

**Solution:** Run proxy as standalone server, route all requests through it.

### 3. Body Parsing Gotcha

**Lesson:** Global `express.json()` middleware consumes request body stream.

**Impact:** Proxy middleware receives empty body, can't forward POST/PUT requests.

**Solution:** Only parse JSON for routes that explicitly need it, let proxy handle raw streams.

### 4. Environment Variable Routing

**Lesson:** Setting `API_URL` environment variable changes where ALL frontend API calls go.

**Impact:** Both client-side fetch and Next.js SSR use the same base URL.

**Solution:** Perfect for routing everything through our proxy!

### 5. Auth Transparency

**Lesson:** Proxy can selectively forward requests to real backend.

**Impact:** Don't need to mock complex auth flows - just proxy them through.

**Solution:** Mock only the endpoints you need (team data), forward everything else.

---

## Security Considerations

### Test Credentials Provider

**Protection:**

```typescript
if (process.env.E2E_TESTING !== 'true') {
  return null; // Provider not registered
}
```

**Why it's safe:**

- Only enabled with explicit environment variable
- Disabled by default in production
- Next.js build excludes test code in production builds
- Backend test endpoint also checks `E2E_TESTING`

### Backend Test Endpoint

**Protection:**

```typescript
@Controller('test')
export class TestAuthController {
  @Post('auth/create-session')
  async createSession() {
    if (process.env.E2E_TESTING !== 'true') {
      throw new NotFoundException(); // 404 in production
    }
    // ...
  }
}
```

**Why it's safe:**

- Returns 404 in production
- Requires explicit environment variable
- Only creates test users (can be cleaned up)
- No access to production data

---

## Future Enhancements

### 1. Dynamic Mock Data

Allow tests to customize mock data per test:

```typescript
// Future API (requires proxy HTTP endpoint)
test('should handle empty team', async ({ page }) => {
  await setMockData({ teamId: 'abc', pokemon: [] });
  await page.goto('/team-builder/abc');
});
```

### 2. Request Verification

Log and assert on API calls made during tests:

```typescript
test('should save team once', async ({ page }) => {
  // ... perform actions
  const calls = await getProxyCalls();
  expect(
    calls.filter((c) => c.method === 'POST' && c.path === '/api/teams')
  ).toHaveLength(1);
});
```

### 3. Cleanup Strategy

Automatically clean up test data:

```typescript
test.afterEach(async () => {
  await fetch('http://localhost:3000/api/test/cleanup');
});
```

### 4. Visual Regression

Add screenshot comparison:

```typescript
test('team editor layout', async ({ page }) => {
  await page.goto('/team-builder/new');
  await expect(page).toHaveScreenshot();
});
```

### 5. Accessibility Testing

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('team editor a11y', async ({ page }) => {
  await page.goto('/team-builder/new');
  await injectAxe(page);
  await checkA11y(page);
});
```

---

## Troubleshooting

### Issue: Auth Timeout

**Symptom:**

```
Failed to set up authentication: apiRequestContext.post: Timeout 30000ms exceeded.
```

**Possible Causes:**

1. MSW proxy not started (check webServer logs)
2. Backend not responding (check health endpoint)
3. Body parsing issue (check proxy middleware order)
4. Port conflicts (check ports 3000, 4200, 9876)

**Solution:**

- Verify all 3 servers start successfully
- Check `API_URL` is set correctly
- Ensure no global body parser before proxy middleware

### Issue: Mock Data Not Returning

**Symptom:**

```
Error: expect(locator).toBeVisible() failed
Element not found: Pikachu
```

**Possible Causes:**

1. Mock handler not matching route
2. Data format mismatch
3. Response not being sent
4. Test looking for wrong text

**Solution:**

- Check proxy logs: `console.error('[MSW Mock] GET /api/teams/...')`
- Verify response format matches frontend expectations
- Check test assertions match actual rendered content

### Issue: Port Already in Use

**Symptom:**

```
Error: http://127.0.0.1:4200 is already used
```

**Solution:**

```bash
# Kill all test servers
fuser -k 3000/tcp 4200/tcp 9876/tcp

# Or specifically
lsof -ti:3000 -ti:4200 -ti:9876 | xargs kill -9
```

### Issue: SSR Requests Not Mocked

**Symptom:**

- Client-side tests pass
- Server-side tests fail
- "Team not found" errors

**Possible Causes:**

1. `API_URL` not set correctly
2. Proxy not forwarding requests
3. Mock route not matching

**Solution:**

- Verify: `E2E_TESTING=true API_URL=http://localhost:9876/api npx nx serve pokehub-app`
- Check proxy logs for incoming requests
- Ensure routes match exactly (check trailing slashes, params)

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: pokehub_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run database migrations
        run: npx drizzle-kit push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pokehub_test

      - name: Run E2E tests
        run: npx nx e2e pokehub-app-e2e --project=chromium
        env:
          E2E_TESTING: true
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pokehub_test
          API_URL: http://localhost:9876/api

      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: apps/pokehub-app-e2e/playwright-report/
          retention-days: 30
```

---

## Related Documentation

- [Backend E2E Testing Architecture](./backend-e2e-testing.md)
- [Team Builder Testing Plan](../plans/team-editor-testing.md)
- [Authentication Documentation](../features/authentication.md)
- [Environment Setup](./environment-setup.md)
- [MSW Documentation](https://mswjs.io/)
- [Playwright Authentication](https://playwright.dev/docs/auth)
- [Next.js Testing](https://nextjs.org/docs/testing)

---

**Last Updated:** December 20, 2025  
**Status:** ✅ Working - MSW Proxy Implementation Complete  
**Test Infrastructure:** Complete and functional  
**Current Coverage:** 63 passing E2E tests (team editor + create profile)
