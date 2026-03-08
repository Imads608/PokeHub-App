# Testing Documentation

## Testing Strategy

1. **Unit Tests** — Isolated testing of services, hooks, and components
2. **Integration Tests** — API endpoint testing with validation pipes
3. **E2E Tests** — Full user flows with real backend and browser

### Coverage Level

- Happy paths — normal operation scenarios
- Error cases — 404, 403, 401, 400 responses
- Edge cases — limits, empty states, boundary conditions
- Validation — Zod structural + Showdown format rules

## Documentation

### Unit & Integration Tests

- [Teams Tests](./teams-tests.md) — Backend services, frontend hooks, integration tests
- [Battle System Tests](./battle-system-tests.md) — All tests added for the battle system
- [Test Utilities & Patterns](./test-utilities.md) — Helpers, factories, mock patterns
- [Technical Challenges](./technical-challenges.md) — ESM issues, async testing, etc.

### E2E Tests

- [Backend E2E Testing](./backend-e2e-testing.md) — NestJS API E2E with real DB and Redis
- [Frontend E2E Testing](./frontend-e2e-testing.md) — Playwright browser tests with MSW proxy
- [E2E Test Reliability Fixes](./e2e-test-reliability-fixes.md) — Flaky test solutions

## Running Tests

```bash
# All unit and integration tests
nx run-many -t test

# Backend unit tests
nx test pokehub-api
nx test pokehub-api --testPathPattern=teams.service

# Frontend unit tests
nx test frontend-pokehub-team-builder
nx test pokehub-battle-components

# Battle backend tests
nx test pokehub-api --testPathPattern="match-orchestrator|battle-socket-bridge|matchmaking|battle.gateway"

# Backend E2E
nx e2e pokehub-api-e2e

# Frontend E2E
nx e2e pokehub-app-e2e

# With coverage
nx run-many -t test --coverage

# Affected projects only
nx affected -t test
```

## Related Documentation

- [Code Style and Patterns](../code-style-and-patterns.md)
