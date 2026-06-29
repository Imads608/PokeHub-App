# Technical Challenges & Solutions

## 1. ESM Module Compatibility (Next-Auth)

**Problem:** Jest fails with `SyntaxError: Cannot use import statement outside a module` when testing code that imports from `next-auth/react` or similar ESM-only packages.

**Why:** Jest uses CommonJS by default and skips `node_modules/` for performance. Most packages ship CJS builds, but `next-auth` is ESM-only.

**Solution:** Add `transformIgnorePatterns` to tell Jest to transform these specific ESM packages:

```typescript
// jest.config.ts
export default {
  transformIgnorePatterns: [
    '/node_modules/(?!(next-auth|@auth/core|jose|oauth4webapi|@panva|preact)/)',
  ],
};
```

Affected jest.config.ts files:
- `apps/pokehub-app/jest.config.ts`
- `packages/frontend/pokehub-nav-components/jest.config.ts`
- `packages/frontend/pokehub-team-builder/jest.config.ts`
- Any package that imports from auth-related code

**Alternative:** Mock the module entirely if you don't need real auth in tests:

```typescript
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
}));
```

## 2. Cross-Domain Dependencies

**Problem:** Backend importing from frontend packages caused circular dependencies.

**Solution:** Created `packages/shared/shared-request-context` package, moved `RequestContext` interface to shared location.

## 3. React Query Async State Testing

**Problem:** Mutation state updates happen asynchronously after `act()` blocks.

**Solution:** Use `waitFor()` for state updates:

```typescript
await act(async () => {
  await result.current.mutateAsync(data);
});

await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});
```

## 4. Pokemon Showdown Validation in Tests

**Problem:** Test data needed to pass both Zod and Showdown validation.

**Solution:** Use Level 100 Pokemon with valid movesets and proper EV/IV distributions:

```typescript
{
  species: 'Pikachu',
  level: 100,
  moves: ['Thunderbolt', 'Volt Switch', 'Nuzzle', 'Quick Attack'],
  evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
}
```

## 5. Jest Mock Patterns with TypeScript

**Problem:** Maintaining type safety while mocking.

**Solution:** Use factory functions in `jest.mock()` with proper typing:

```typescript
jest.mock('../api/teams-api', () => ({
  createTeamRequest: jest.fn(),
}));

const mockCreateTeamRequest = createTeamRequest as jest.Mock;
```

## 6. Authorization Bug in DELETE Endpoint

**Problem:** DELETE endpoint returned `404 Not Found` instead of `403 Forbidden` when user tried to delete another user's team.

**Root Cause:** The `deleteTeam` method didn't verify ownership before attempting deletion. The database used an AND condition, making "not found" and "not owned" indistinguishable.

**Fix:** Added ownership verification before deletion:

```typescript
async deleteTeam(teamId: string, userId: string): Promise<void> {
  const existingTeam = await this.teamsDbService.getTeam(teamId);
  if (!existingTeam) throw new NotFoundException('Team not found');
  if (existingTeam.userId !== userId) throw new ForbiddenException('You do not have access to this team');
  await this.teamsDbService.deleteTeam(teamId, userId);
}
```
