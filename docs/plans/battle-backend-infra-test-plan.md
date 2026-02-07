# Battle System Tests

## Context

The battle backend infrastructure is implemented (services, gateway, Redis, types) but has no test coverage. Tests are needed before moving to frontend work. The codebase has established test patterns in the teams module (unit tests in `pokehub-api`, integration tests in `pokehub-api-e2e`).

## Test Strategy

Three tiers of testing:

1. **Unit tests** — Test each service in isolation with mocked dependencies. Covers all business logic branches.
2. **Integration tests** — Test the WebSocket gateway end-to-end with real Redis + PostgreSQL, using `socket.io-client`. Follows the existing pattern in `pokehub-api-e2e/src/pokehub-api/teams.spec.ts`.
3. **Frontend E2E (Playwright)** — Deferred. The battle UI does not exist yet; these tests will be written alongside the frontend implementation.

---

## Part 1: Unit Tests

Following existing pattern from `teams.service.spec.ts`:

- `Test.createTestingModule()` for DI setup
- `jest.Mocked<Interface>` for typed mocks
- Self-contained factory functions per test file
- `jest.clearAllMocks()` in `beforeEach`

### 1. `apps/pokehub-api/src/battle/services/turn-timer/turn-timer.service.spec.ts`

**Dependencies to mock:** AppLogger only

**Key technique:** `jest.useFakeTimers()` to control setTimeout

**Tests:**

- `startTimers` — starts timers for players who haven't chosen, skips those who have
- Warning callback fires at 30s with correct args (battleId, player, secondsRemaining)
- Timeout callback fires at 60s with correct args (battleId, player, playerId)
- `cancelPlayerTimer` — clears timers for one player without affecting the other
- `cancelBattleTimers` — clears all timers and removes from Map
- `hasActiveTimer` — returns true/false based on timer state
- Starting timers clears existing ones for same player
- Multiple battles have independent timers

### 2. `apps/pokehub-api/src/battle/services/matchmaking/matchmaking.service.spec.ts`

**Dependencies to mock:** AppLogger, REDIS_SERVICE

**Tests:**

- `joinQueue` — adds player, returns position, sets queue status
- `joinQueue` — removes from existing queue first if already queued
- `joinQueue` — throws when player is in a battle
- `leaveQueue` — clears queue status, returns early if not queued
- `isInQueue` — returns true/false based on queue status
- `findMatch` — returns MatchResult when 2 valid players popped
- `findMatch` — clears queue status for both matched players
- `findMatch` — returns null when not enough players
- `findMatch` — returns null and puts back valid player when other player left (lazy removal)

### 3. `apps/pokehub-api/src/battle/services/battle-persistence/battle-persistence.service.spec.ts`

**Dependencies to mock:** AppLogger, BATTLES_DB_SERVICE, REDIS_SERVICE

**Tests:**

- `saveReplay` — fetches seed from Redis, maps config fields, delegates to DB
- `saveReplay` — throws when seed not found
- `deleteReplay` — delegates to DB
- `getUserReplayCount` — delegates to DB
- `getSavedReplays` — delegates to DB
- `getReplay` — delegates to DB
- `canSaveReplay` — returns true when count < 10, false when >= 10

### 4. `apps/pokehub-api/src/battle/services/battle-manager/battle-manager.service.spec.ts`

**Dependencies to mock:** AppLogger, REDIS_SERVICE, TURN_TIMER_SERVICE, `@pkmn/sim` (via `jest.mock`)

**@pkmn/sim mock strategy:** Full module mock — mock `BattleStreams.BattleStream` and `getPlayerStreams` to return controllable objects. We're testing BattleManagerService's coordination logic, not the battle engine.

**Tests:**

- Constructor registers turn timer callbacks
- `createBattle` — creates stream, stores in Redis (metadata, seed, server battle), sets user battles, starts timers, returns ActiveBattle
- `processChoice` — stores pending choice, cancels player timer, appends to log
- `processChoice` — executes turn when both choices received (writes to stream, publishes update, starts new timers)
- `processChoice` — throws when battle not found or player not in battle
- `forfeit` — ends battle with other player as winner
- `recoverBattle` — fetches metadata/seed/log from Redis, replays commands, updates host server
- `recoverBattle` — throws when metadata or seed not found
- `getBattle` — returns battle or undefined
- `isHostedLocally` — checks local Map
- `handleDisconnect` — sets disconnect flag, publishes event, schedules 2-min timeout
- `handleReconnect` — clears disconnect flag, publishes event, returns state; recovers if not local
- `endBattle` (via forfeit/turn) — cancels timers, updates Redis status, publishes end event, clears user battles, sets log TTL, removes from Map
- Turn timeout — uses `side.autoChoose()` and `side.getChoice()`, processes result

---

## Part 2: Integration Tests (API E2E)

### File: `apps/pokehub-api-e2e/src/pokehub-api/battle.spec.ts`

**Pattern:** Same as `teams.spec.ts` — import `AppModule`, create NestJS test app, but use `socket.io-client` instead of supertest for WebSocket communication.

**Setup:**

```typescript
// beforeAll:
// 1. Create NestJS app from AppModule (same as teams.spec.ts)
// 2. app.listen(0) to get a random port (needed for WebSocket unlike supertest)
// 3. Create 2 test users in DB, generate JWT tokens
// 4. Create a valid team for each user (AG format, Charizard — reuse createMockPokemon from teams.spec.ts pattern)
```

**Socket connection helper:**

```typescript
// Connect to ws://localhost:{port}/battle with auth token
// WsJwtGuard.extractToken() supports: Authorization header, query param, or handshake.auth.token
// Use handshake.auth.token approach (simplest with socket.io-client)
function connectSocket(port: number, token: string): Socket {
  return io(`http://localhost:${port}/battle`, {
    auth: { token },
    transports: ['websocket'],
  });
}
```

**Test suites:**

#### Connection & Auth

- Connects successfully with valid JWT, receives no error
- Disconnects immediately with invalid JWT (gateway calls `client.disconnect()`)
- Disconnects with missing token

#### Queue Management

- JOIN_QUEUE with valid team → receives QUEUE_JOINED with position
- JOIN_QUEUE with non-existent teamId → receives ERROR (TEAM_NOT_FOUND)
- JOIN_QUEUE with another user's team → receives ERROR (INVALID_TEAM)
- LEAVE_QUEUE → receives QUEUE_LEFT
- JOIN_QUEUE with invalid input (missing format/teamId) → receives ERROR (INVALID_INPUT)

#### Matchmaking & Battle Flow (full flow test)

- Player 1 joins queue → QUEUE_JOINED
- Player 2 joins queue → both receive MATCH_FOUND (with opponent info) then BATTLE_START (with initialState)
- Both BATTLE_START events contain non-empty initialState from @pkmn/sim

#### Forfeit

- After match, player 1 sends FORFEIT → both receive BATTLE_END (player 2 wins, reason: forfeit)

#### Reconnection

- Player disconnects during battle → opponent receives OPPONENT_DISCONNECTED
- Player reconnects and sends REJOIN → opponent receives OPPONENT_RECONNECTED, player gets BATTLE_START with state

#### Save Replay

- After battle ends, SAVE_REPLAY → receives REPLAY_SAVED with replayCount

#### Cleanup (afterAll)

- Close both sockets
- Delete test teams and users
- Close NestJS app

**Dependencies:** Requires PostgreSQL + Redis running. Locally via `docker-compose.dev.yaml`. In CI, needs Redis added as service container (see Part 3).

---

## Part 3: CI Pipeline Update

### File: `.github/workflows/ci.yml`

Add Redis service container to the `e2e` job alongside the existing PostgreSQL container:

```yaml
services:
  postgres:
    # ... (existing)
  redis:
    image: redis:7-alpine
    ports:
      - 6379:6379
    options: >-
      --health-cmd="redis-cli ping"
      --health-interval=10s
      --health-timeout=5s
      --health-retries=5
```

Add Redis env vars to the e2e job:

```yaml
env:
  REDIS_HOST: localhost
  REDIS_PORT: 6379
  REDIS_PASSWORD: ''
  REDIS_TLS: 'false'
```

---

## Part 4: Frontend E2E (Deferred)

Playwright tests for the battle UI will be written when the frontend battle feature is implemented. The existing pattern (`pokehub-app-e2e/`) uses browser-based authentication, stored auth state, and page object models. Battle E2E tests would cover:

- Navigate to battle page, join queue, see match found
- Battle UI interactions (selecting moves, seeing updates)
- Forfeit flow, battle end screen
- Replay saving from battle end screen

This is documented here for completeness but **out of scope** for the current task.

---

## Reference Files

- `apps/pokehub-api/src/teams/teams.service.spec.ts` — unit test pattern
- `apps/pokehub-api-e2e/src/pokehub-api/teams.spec.ts` — integration test pattern (AppModule import, real DB, JWT tokens, cleanup)
- `apps/pokehub-api-e2e/jest.config.ts` — e2e jest config
- `apps/pokehub-api/src/battle/battle.gateway.ts` — WebSocket handlers to test
- `apps/pokehub-api/src/battle/guards/ws-jwt.guard.ts` — auth extraction (supports auth.token, query.token, Authorization header)
- `.github/workflows/ci.yml` — CI pipeline (e2e job needs Redis service)

## Verification

```bash
# Unit tests
nx test pokehub-api --testPathPattern=battle

# Integration tests (requires docker-compose up for PostgreSQL + Redis)
nx e2e pokehub-api-e2e --testPathPattern=battle
```
