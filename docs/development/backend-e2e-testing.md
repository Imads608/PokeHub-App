# Backend E2E Testing Architecture

## Table of Contents

- [Current Status](#current-status)
- [Architecture Overview](#architecture-overview)
- [Database Setup Strategy](#database-setup-strategy)
  - [Local Development](#local-development)
  - [CI Environment](#ci-environment)
- [Test Implementation Approach](#test-implementation-approach)
- [Test Coverage](#test-coverage)
- [Files & Components](#files--components)
- [Test Execution](#test-execution)
- [Common Issues & Fixes](#common-issues--fixes)
- [Test Isolation & Parallel Execution](#test-isolation--parallel-execution)
- [CI/CD Integration](#cicd-integration)
- [Advantages of This Approach](#advantages-of-this-approach)
- [Related Documentation](#related-documentation)

---

## Current Status

**✅ FULLY FUNCTIONAL** - All Backend E2E Tests Passing

**Current Test Results:**

- ✅ **Backend API E2E Tests: 70/70 passing (100%)**
  - Teams API: 43 tests
  - Users API: 27 tests
- ✅ Backend Unit Tests: 64 passing
- ✅ Backend Integration Tests: 87 passing
- ✅ Frontend Playwright E2E Tests: 63 passing
- ✅ Frontend Unit Tests: 283+ passing

---

## Architecture Overview

The backend E2E tests validate the full Teams API through complete HTTP request/response cycles, including:

- **Real Database**: PostgreSQL with full schema
- **Real Authentication**: JWT tokens and guards
- **Real Validation**: Zod schemas + Pokemon Showdown validation
- **Real Business Logic**: Full service layer execution
- **HTTP Layer**: Complete NestJS request pipeline

### Key Components

```
┌─────────────────────────────────────────────────────────────┐
│                  Backend E2E Test Flow                       │
│                                                              │
│  Jest Test Suite                                            │
│       │                                                      │
│       ├─→ beforeAll: Create test users + JWT tokens        │
│       │                                                      │
│       ├─→ Test: Supertest HTTP Request                     │
│       │     │                                                │
│       │     ├─→ Authorization: Bearer <JWT>                │
│       │     ↓                                                │
│       │   NestJS Application                                │
│       │     │                                                │
│       │     ├─→ JWT Guard (validates token)                │
│       │     ├─→ ValidationPipe (Zod + Showdown)            │
│       │     ├─→ TeamsController                            │
│       │     ├─→ TeamsService                               │
│       │     ├─→ TeamsDBService                             │
│       │     ↓                                                │
│       │   PostgreSQL Database                               │
│       │     │                                                │
│       │     └─→ CRUD operations on real tables             │
│       │                                                      │
│       └─→ afterAll/afterEach: Cleanup test data            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Setup Strategy

### Local Development

**Setup:**

1. Local PostgreSQL instance running (default: port 5432)
2. Database configured via `.env` or `.env.test` file
3. Schema created via Drizzle migrations
4. Test users created/destroyed per test suite

**Environment Variables:**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pokehub_test
JWT_SECRET=test-secret-key
E2E_TESTING=true
```

**Running Tests:**

```bash
# Run all backend E2E tests
npx nx e2e pokehub-api-e2e

# Run specific test file
npx nx e2e pokehub-api-e2e --testFile=teams.spec.ts

# Run with verbose output
npx nx e2e pokehub-api-e2e --verbose
```

### CI Environment

**Setup (GitHub Actions):**

1. PostgreSQL 15 Docker container started automatically
2. Database `pokehub_test` created via `POSTGRES_DB` environment variable
3. **CRITICAL**: Migrations must run before tests to create schema
4. Test users created/cleaned up same as local

**Required CI Configuration:**

```yaml
# .github/workflows/ci.yml
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
  - name: Install dependencies
    run: npm ci

  - name: Run database migrations
    run: npx tsx --tsconfig tsconfig.base.json node_modules/drizzle-kit/bin.cjs migrate --config=drizzle.config.pg.ts
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pokehub_test

  - name: Run E2E tests
    run: npx nx e2e pokehub-api-e2e
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pokehub_test
      JWT_SECRET: test-secret-key
      E2E_TESTING: true
```

**Why Migration is Critical:**

- PostgreSQL container starts with empty `pokehub_test` database
- Migrations create the schema (users, teams tables, etc.)
- Without migrations, E2E tests fail with "relation does not exist" errors

---

## Test Implementation Approach

### 1. Setup Phase (beforeAll)

**Purpose:** Create test environment and authentication credentials

```typescript
// apps/pokehub-api-e2e/src/pokehub-api/teams.spec.ts

let app: INestApplication;
let jwtService: JwtService;
let usersDBService: UsersDBService;
let teamsDBService: TeamsDBService;

let testUser1: User;
let testUser2: User;
let user1Token: string;
let user2Token: string;

beforeAll(async () => {
  // 1. Bootstrap NestJS application
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  // 2. Get services from DI container
  jwtService = app.get<JwtService>(JwtService);
  usersDBService = app.get<UsersDBService>(UsersDBService);
  teamsDBService = app.get<TeamsDBService>(TeamsDBService);

  // 3. Create test users with known UUIDs
  testUser1 = await usersDBService.createUser({
    id: '11111111-1111-1111-1111-111111111111',
    email: 'test1@example.com',
    name: 'Test User 1',
    image: null,
  });

  testUser2 = await usersDBService.createUser({
    id: '22222222-2222-2222-2222-222222222222',
    email: 'test2@example.com',
    name: 'Test User 2',
    image: null,
  });

  // 4. Generate valid JWT tokens
  user1Token = jwtService.sign({
    sub: testUser1.id,
    email: testUser1.email,
  });

  user2Token = jwtService.sign({
    sub: testUser2.id,
    email: testUser2.email,
  });
});
```

### 2. Test Execution

**Purpose:** Make authenticated HTTP requests and validate responses

```typescript
describe('POST /api/teams', () => {
  it('should create a new team', async () => {
    const createTeamDto = {
      name: 'My Test Team',
      format: 'gen9ou',
      gen: 9,
      pokemon: [
        {
          speciesId: 'pikachu',
          nickname: 'Sparky',
          level: 50,
          moves: ['thunderbolt', 'quickattack', 'irontail', 'thunderwave'],
          ability: 'static',
          nature: 'jolly',
          evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          item: 'lightball',
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/api/teams')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(createTeamDto)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: 'My Test Team',
      format: 'gen9ou',
      gen: 9,
      userId: testUser1.id,
      pokemon: expect.arrayContaining([
        expect.objectContaining({
          speciesId: 'pikachu',
          nickname: 'Sparky',
        }),
      ]),
    });

    createdTeamIds.push(response.body.id);
  });
});
```

### 3. Cleanup Phase (afterEach/afterAll)

**Purpose:** Remove test data to prevent pollution and quota violations

```typescript
// For suites that create teams in individual tests
afterEach(async () => {
  for (const teamId of createdTeamIds) {
    await teamsDBService.deleteTeam(teamId, testUser1.id);
  }
  createdTeamIds.length = 0;
});

// For suites that share a team across tests
afterAll(async () => {
  if (sharedTeamId) {
    await teamsDBService.deleteTeam(sharedTeamId, testUser1.id);
  }

  // Cleanup test users
  await usersDBService.deleteUser(testUser1.id);
  await usersDBService.deleteUser(testUser2.id);

  // Close application
  await app.close();
});
```

---

## Test Coverage

### Comprehensive API Validation

The E2E tests validate **70 test cases** covering:

### Teams API (43 tests)

#### 1. CRUD Operations

- ✅ Create new teams (POST /api/teams)
- ✅ Get all user teams (GET /api/teams)
- ✅ Get team by ID (GET /api/teams/:id)
- ✅ Update existing teams (PUT /api/teams/:id)
- ✅ Delete teams (DELETE /api/teams/:id)

#### 2. Authentication & Authorization

- ✅ JWT token validation
- ✅ User isolation (users can't access other users' teams)
- ✅ Unauthorized access returns 401
- ✅ Forbidden access returns 403

#### 3. Validation Pipeline

- ✅ Zod schema validation (team structure, required fields)
- ✅ Pokemon Showdown validation (legal moves, abilities, items)
- ✅ Team size limits (max 6 Pokemon)
- ✅ Team quota enforcement (max 5 teams per user)
- ✅ Invalid data returns 400 with error details

#### 4. Database Constraints

- ✅ Foreign key constraints (teams belong to users)
- ✅ Cascade deletion (deleting teams doesn't break DB)
- ✅ Data persistence (teams survive server restarts)

#### 5. HTTP Status Codes

- ✅ 200 OK (successful GET, PUT)
- ✅ 201 Created (successful POST)
- ✅ 204 No Content (successful DELETE)
- ✅ 400 Bad Request (validation errors)
- ✅ 401 Unauthorized (missing/invalid token)
- ✅ 403 Forbidden (accessing other user's teams)
- ✅ 404 Not Found (team doesn't exist)

#### 6. Request/Response Serialization

- ✅ JSON parsing and formatting
- ✅ Date/timestamp handling
- ✅ Nested object structures (Pokemon array)
- ✅ Optional fields (nickname, item, etc.)

### Users API (27 tests)

#### 1. HEAD /users/:id - Availability Checks (7 tests)

- ✅ Return 404 for non-existent user ID
- ✅ Return 200 for existing user ID
- ✅ Return 200 for existing email
- ✅ Return 404 for non-existent email
- ✅ Return 404 for non-existent username
- ✅ Return 403 without auth token
- ✅ Return 403 with invalid auth token

#### 2. POST /users/:userId/profile - Profile Updates (14 tests)

- ✅ Update profile with valid username
- ✅ Update profile with username and avatar filename
- ✅ Return 403 without auth token
- ✅ Return 403 with invalid auth token
- ✅ Return 400 when username too short (< 3 chars)
- ✅ Return 400 when username too long (> 20 chars)
- ✅ Accept username with special characters (backend only validates length)
- ✅ Return 400 when username is missing
- ✅ Return 400 with invalid avatar filename
- ✅ Accept valid avatar extensions (png, jpg, jpeg, gif)
- ✅ Allow username with underscores
- ✅ Allow username with numbers
- ✅ Handle concurrent profile updates gracefully

#### 3. Username Uniqueness (2 tests)

- ✅ Check if username is taken after profile update (returns 200)
- ✅ Return 404 for available username

#### 4. Edge Cases and Security (4 tests)

- ✅ Handle very long request gracefully (extra fields ignored)
- ✅ Handle SQL injection attempts safely (stored as literal string)
- ✅ Reject XSS attempts due to length validation
- ✅ Reject path traversal attempts in avatar filename

**Key Finding:** Backend only validates username length (3-20 characters), not character set. Character validation (letters, numbers, underscores only) is enforced on the frontend.

---

## Files & Components

### Test Files

**`apps/pokehub-api-e2e/src/pokehub-api/teams.spec.ts`**

Teams API E2E test suite with 43 test cases organized in describe blocks:

- POST /api/teams (4 tests)
- GET /api/teams (3 tests)
- GET /api/teams/:id (5 tests)
- PUT /api/teams/:id (6 tests)
- DELETE /api/teams/:id (5 tests)
- Complex Validation Scenarios (10 tests)
- Authorization & User Isolation (10 tests)

**`apps/pokehub-api-e2e/src/pokehub-api/users.spec.ts`**

Users API E2E test suite with 27 test cases organized in describe blocks:

- HEAD /users/:id - availability checks (7 tests)
- POST /users/:userId/profile - profile updates (14 tests)
- Username uniqueness (2 tests)
- Edge cases and security (4 tests)

### Configuration Files

**`apps/pokehub-api-e2e/jest.config.ts`**

```typescript
export default {
  displayName: 'pokehub-api-e2e',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/pokehub-api-e2e',
  testTimeout: 30000, // 30 seconds
};
```

**`apps/pokehub-api-e2e/src/test-setup.ts`**

Global test configuration (if needed):

```typescript
// Set longer timeout for E2E tests
jest.setTimeout(30000);

// Suppress expected error logs
global.console.error = jest.fn();
```

### Backend Support

**`apps/pokehub-api/src/app/app.module.ts`**

Production NestJS module with all services, controllers, and guards

**`packages/backend/pokehub-teams-db/src/lib/teams-db.service.ts`**

Database service with CRUD operations:

```typescript
@Injectable()
export class TeamsDBService {
  async createTeam(userId: string, team: InsertTeam): Promise<Team>;
  async getUserTeams(userId: string): Promise<Team[]>;
  async getTeamById(teamId: string): Promise<Team | null>;
  async updateTeam(
    teamId: string,
    userId: string,
    updates: Partial<Team>
  ): Promise<Team>;
  async deleteTeam(teamId: string, userId: string): Promise<void>;
  async countUserTeams(userId: string): Promise<number>;
}
```

---

## Test Execution

### Running Tests Locally

```bash
# Prerequisites: PostgreSQL running with pokehub_test database

# Run all backend E2E tests
npx nx e2e pokehub-api-e2e

# Run specific test suite
npx nx e2e pokehub-api-e2e --testFile=teams.spec.ts

# Run specific test pattern
npx nx e2e pokehub-api-e2e --testNamePattern="should create a new team"

# Run with verbose output
npx nx e2e pokehub-api-e2e --verbose

# Run with coverage
npx nx e2e pokehub-api-e2e --coverage
```

### What Happens During Execution

1. **Database Connection:**

   - Connect to PostgreSQL using `DATABASE_URL`
   - Verify schema exists (from previous migrations)

2. **Application Bootstrap:**

   - NestJS application starts
   - Services initialized
   - Database connections established

3. **Test Setup (beforeAll):**

   - Create test users
   - Generate JWT tokens
   - Get service instances from DI container

4. **Test Execution:**

   - Make HTTP requests via supertest
   - Validate responses
   - Check database state

5. **Cleanup (afterEach/afterAll):**

   - Delete created teams
   - Delete test users
   - Close application
   - Disconnect from database

6. **Results:**
   - Jest reports pass/fail
   - Coverage report (if enabled)
   - Execution time statistics

---

## Common Issues & Fixes

### Issue 1: Foreign Key Constraint Violation ❌

**Symptom:**

```
Error: insert or update on table "teams" violates foreign key constraint "teams_user_id_users_id_fk"
```

**Root Cause:**

- Test user not created before team creation
- User ID mismatch between token and database

**Fix:**

```typescript
// Ensure user exists before creating teams
beforeAll(async () => {
  testUser1 = await usersDBService.createUser({
    id: '11111111-1111-1111-1111-111111111111',
    email: 'test1@example.com',
    name: 'Test User 1',
  });
});
```

### Issue 2: Team Limit Violations ❌

**Symptom:**

```
Error: You have reached the maximum number of teams (5)
```

**Root Cause:**

- Tests creating multiple teams without cleanup
- User quota (MAX_TEAMS_PER_USER = 5) exceeded
- Multiple test suites using same user

**Fix:**

```typescript
// Add cleanup after each test
afterEach(async () => {
  for (const teamId of createdTeamIds) {
    await teamsDBService.deleteTeam(teamId, testUser1.id);
  }
  createdTeamIds.length = 0;
});
```

**Impact:**

- Without cleanup: Tests fail when user reaches 5-team limit
- With cleanup: Each test starts fresh, quota resets
- Cleanup order matters: Delete teams before deleting users

### Issue 3: Orphaned Test Data ❌

**Symptom:**

- Tests pass initially
- Subsequent runs fail due to existing data
- Database accumulates stale test records

**Root Cause:**

- Cleanup not running (tests crash before afterAll)
- Errors in cleanup logic
- Missing cleanup for all test paths

**Fix:**

```typescript
// Use try-finally for guaranteed cleanup
afterAll(async () => {
  try {
    // Cleanup teams
    for (const teamId of allTeamIds) {
      await teamsDBService.deleteTeam(teamId, testUser1.id).catch(() => {});
    }

    // Cleanup users
    await usersDBService.deleteUser(testUser1.id).catch(() => {});
    await usersDBService.deleteUser(testUser2.id).catch(() => {});
  } finally {
    await app.close();
  }
});
```

### Issue 4: JWT Token Expiration ❌

**Symptom:**

```
Error: 401 Unauthorized - Token expired
```

**Root Cause:**

- JWT token expiration time too short
- Long-running test suites exceed token validity

**Fix:**

```typescript
// Generate tokens with longer expiration for tests
user1Token = jwtService.sign(
  {
    sub: testUser1.id,
    email: testUser1.email,
  },
  { expiresIn: '1h' } // Long enough for test suite
);
```

### Issue 5: Database Connection Leaks ❌

**Symptom:**

```
Warning: Jest did not exit one second after the test run completed
```

**Root Cause:**

- Database connections not closed properly
- NestJS application not shut down

**Fix:**

```typescript
afterAll(async () => {
  // Close NestJS app (also closes DB connections)
  await app.close();
});
```

---

## Test Isolation & Parallel Execution

### How Tests Run

**Current Configuration:**

- Tests run in **parallel** by default (Jest's default behavior)
- Multiple test suites execute concurrently
- Each suite creates/destroys its own data

### Why Parallel Execution Works

1. **User Isolation:**

   - Each user (user1, user2) has independent team quotas (5 teams each)
   - Tests don't share team data between users

2. **Immediate Cleanup:**

   - `afterEach` hooks run immediately after each test completes
   - `afterAll` hooks run immediately after each suite completes
   - Database operations are atomic and transactional

3. **Sufficient Quota:**

   - Even if tests overlap, each user has 5-team quota
   - Cleanup ensures quota doesn't fill up
   - Multiple suites can use same user safely

4. **Test Data Isolation:**
   - Each test creates unique teams (different names, IDs)
   - No shared state between tests
   - Database constraints prevent conflicts

### Verified Stability

✅ Tests run consistently passing across multiple sequential executions  
✅ No race conditions observed  
✅ Cleanup reliably removes all test data  
✅ Fast execution (parallel tests complete in ~10-15 seconds)

### Fallback: Sequential Execution

If flakiness occurs in CI environment, force sequential execution:

```typescript
// apps/pokehub-api-e2e/jest.config.ts
export default {
  // ... other config
  maxWorkers: 1, // Force sequential execution (trades speed for absolute safety)
};
```

**Trade-offs:**

- ✅ Absolute safety - no concurrency issues
- ❌ Slower execution - tests run one at a time
- ⚠️ Only needed if parallel execution shows flakiness

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
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
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npx tsx --tsconfig tsconfig.base.json node_modules/drizzle-kit/bin.cjs migrate --config=drizzle.config.pg.ts
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pokehub_test

      - name: Run backend E2E tests
        run: npx nx e2e pokehub-api-e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/pokehub_test
          JWT_SECRET: test-secret-key
          E2E_TESTING: true

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: coverage/apps/pokehub-api-e2e
```

### Critical CI Configuration

1. **PostgreSQL Service:**

   - Must use `postgres:15` (matches production)
   - Health checks ensure DB is ready before tests
   - Ports exposed to localhost

2. **Environment Variables:**

   - `DATABASE_URL` points to test database
   - `JWT_SECRET` for token generation
   - `E2E_TESTING=true` to enable test endpoints

3. **Migration Step:**

   - **MUST** run before E2E tests
   - Creates schema in empty `pokehub_test` database
   - Uses same Drizzle config as production

4. **Test Execution:**
   - Run after migrations complete
   - Inherit environment variables
   - Fail workflow if tests fail

---

## Advantages of This Approach

### ✅ Pros

1. **True E2E Validation:**

   - Tests complete request/response cycle
   - Validates entire stack (HTTP → controller → service → database)
   - Catches integration bugs unit tests miss

2. **Real Database Testing:**

   - Validates database constraints and relationships
   - Tests actual SQL queries, not mocks
   - Catches migration issues early

3. **Production-Like Environment:**

   - Same authentication flow as production
   - Same validation pipeline as production
   - Same error handling as production

4. **Test Isolation:**

   - Each test creates/destroys its own data
   - No pollution between test runs
   - Parallel execution is safe

5. **CI-Ready:**

   - Minimal configuration required
   - Works with GitHub Actions out of the box
   - Easy to run locally

6. **Fast Execution:**

   - Parallel tests complete in ~10-15 seconds
   - Faster than starting Playwright browsers
   - Immediate feedback for developers

7. **Maintainable:**
   - Clear test structure
   - Easy to add new test cases
   - Well-documented patterns

### ⚠️ Cons

1. **Requires Database:**

   - Must have PostgreSQL running
   - Migrations must be up to date
   - Adds dependency to test environment

2. **Slower Than Unit Tests:**

   - Full application bootstrap
   - Real database I/O
   - HTTP overhead

3. **Cleanup Complexity:**

   - Must track created resources
   - Cleanup order matters (teams before users)
   - May leave orphaned data if tests crash

4. **Environment Setup:**
   - Need test database credentials
   - Must configure environment variables
   - CI requires service containers

### Comparison with Alternatives

| Approach                        | E2E Coverage | Speed          | Setup     | Maintenance | Reliability |
| ------------------------------- | ------------ | -------------- | --------- | ----------- | ----------- |
| **Real Database E2E (Current)** | ✅✅ Full    | ✅ Fast        | ⚠️ Medium | ✅ Low      | ✅✅ High   |
| Unit Tests + Mocks              | ❌ Partial   | ✅✅ Very Fast | ✅ Easy   | ⚠️ High     | ⚠️ Medium   |
| In-Memory Database              | ✅ Good      | ✅ Fast        | ✅ Easy   | ✅ Low      | ⚠️ Medium   |
| Real Backend + Integration      | ✅ Good      | ⚠️ Slow        | ⚠️ Medium | ✅ Low      | ✅ High     |

---

## Related Documentation

- [Frontend E2E Testing Architecture](./frontend-e2e-testing.md)
- [Team Builder Testing Plan](../plans/team-editor-testing.md)
- [Authentication Documentation](../features/authentication.md)
- [Database Schema](../deployment/database.md)
- [Environment Setup](./environment-setup.md)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/ladjs/supertest)

---

**Last Updated:** December 20, 2025  
**Status:** ✅ Fully Functional - All 70 Tests Passing  
**Test Coverage:** Complete API validation with real database (Teams + Users)  
**Execution:** Parallel execution with proper test isolation
