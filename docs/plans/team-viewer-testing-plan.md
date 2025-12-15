# Testing Plan: Team Viewer Feature (/team-builder)

## Overview
Create comprehensive unit, integration, and e2e tests for the Team Viewer feature, following the established testing patterns in the PokeHub codebase.

## Feature Summary
The Team Viewer feature allows users to:
- View all their Pokemon teams in a list/grid
- Search teams by name
- Filter by generation and format
- Sort by name, created date, or updated date
- Switch between grid and list view modes
- Create, duplicate, and delete teams
- Navigate to team editor

**Key Components:**
- `TeamViewer` - Main viewer component with filters
- `TeamCard` - Grid view team card
- `TeamListItem` - List view team item
- `DeleteTeamDialog` - Deletion confirmation dialog

**Key Hooks:**
- `useUserTeams()` - Fetch teams with React Query
- `useFilteredTeams()` - Client-side filtering/sorting logic
- `useCreateTeam()`, `useUpdateTeam()`, `useDeleteTeam()` - Mutations

**Context:**
- `TeamViewerFiltersContext` - Manages search, filters, sort, view mode state

---

## 1. UNIT TESTS

### 1.1 Component Tests

#### File: `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/team-viewer.spec.tsx`

**Test Coverage:**
- **Rendering States:**
  - Loading skeleton while fetching
  - Error state on fetch failure
  - Empty state (no teams)
  - Teams display in grid/list view

- **Filter Functionality:**
  - Search filters teams by name (case-insensitive)
  - Generation filter shows available generations
  - Format filter updates based on generation
  - Sort by name/created/updated
  - Sort order toggle (asc/desc)
  - Reset filters clears all
  - Active filters badge displays when filters applied

- **View Mode:**
  - Grid view shows TeamCard components
  - List view shows TeamListItem components
  - View toggle persists

- **Team Actions:**
  - Create button navigates to `/team-builder/new`
  - Edit navigates to `/team-builder/:id`
  - Duplicate creates copy and navigates
  - Delete opens confirmation dialog
  - Toast notifications on success/error

**Mocking Strategy:**
```typescript
jest.mock('../hooks/useTeams');
jest.mock('./context/team-viewer.context');
jest.mock('./hooks/useFilteredTeams');
jest.mock('next/navigation');
jest.mock('sonner');
```

---

#### File: `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/components/team-card.spec.tsx`

**Test Coverage:**
- Display team name, format badge, Pokemon sprites (1-6), timestamp
- Actions menu (edit, duplicate, delete)
- Click card navigates to editor
- Dropdown menu interactions
- Edge cases: long names, missing timestamps

**Mocking:**
```typescript
jest.mock('@pkmn/img');
jest.mock('@pokehub/frontend/dex-data-provider');
jest.mock('next/link');
```

---

#### File: `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/components/team-list-item.spec.tsx`

**Test Coverage:**
- Horizontal layout rendering
- Pokemon sprites inline display
- Action buttons on hover
- Navigation on click
- Same action handlers as TeamCard

---

#### File: `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/components/delete-team-dialog.spec.tsx`

**Test Coverage:**
- Displays team name in warning
- Cancel closes dialog
- Delete button calls onConfirm
- Buttons disabled during deletion
- Shows "Deleting..." loading state
- Handles null team gracefully

---

### 1.2 Hook Tests

#### File: `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/hooks/useFilteredTeams.spec.ts`

**Test Coverage:**
- **Search filtering:** Filters by name (case-insensitive), empty search returns all
- **Generation filtering:** Filters by gen, 'all' returns all
- **Format filtering:** Filters by format, works with generation filter
- **Sorting:** By name (alphabetical), created (chronological), updated (most recent)
- **Sort order:** Asc/desc toggle
- **Combined filters:** Search + generation + format + sort work together

**Key Test:**
```typescript
it('should filter and sort teams correctly', () => {
  // Test with: searchTerm='Team', generation=9, sortBy='name', sortOrder='asc'
  // Verify: Returns only Gen 9 teams matching search, sorted by name
});
```

---

### 1.3 Context Tests

#### File: `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/context/team-viewer.provider.spec.tsx`

**Test Coverage:**
- **Initial state:** All defaults (search='', generation='all', format='all', sortBy='updated', sortOrder='desc', viewMode='grid')
- **State updates:** searchTerm, selectedGeneration, selectedFormat, sortBy, viewMode setters
- **Helper functions:** toggleSortOrder(), toggleViewMode(), resetFilters()
- **Computed values:** hasActiveFilters detects active filters

---

## 2. INTEGRATION TESTS

### 2.1 Component + Hook Integration

#### File: `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/team-viewer.integration.spec.tsx`

**Test Coverage:**
- **Complete filter flow:** User input → context update → hook filtering → component render
- **API + React Query:** useUserTeams fetches → cache updates → mutations invalidate cache
- **Context propagation:** Provider → Consumer components receive updates
- **Real hook behavior:** Use actual hooks, mock only API layer

**Setup:**
```typescript
// Use QueryClientProvider with test client
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
});

// Mock only API layer
jest.mock('../api/teams-api');
jest.mock('@pokehub/frontend/shared-auth');
```

---

### 2.2 API Integration Tests

**Extend existing:** `/packages/frontend/pokehub-team-builder/src/lib/hooks/useTeams.spec.tsx`

**Additional scenarios:**
- Empty array response handling
- Server errors (401, 403, 500)
- StaleTime behavior (30s)
- Cache invalidation after mutations
- Parallel mutation handling
- Optimistic updates

---

## 3. E2E TESTS

### File: `/apps/pokehub-app-e2e/src/team-viewer.spec.ts`

**Test User Flows:**

#### Flow 1: View Team List
```typescript
test('should display user teams with filtering', async ({ page }) => {
  // Navigate to /team-builder
  // Verify teams load
  // Filter by generation
  // Verify filtered results
});
```

#### Flow 2: Search Teams
```typescript
test('should search teams by name', async ({ page }) => {
  // Type in search box
  // Verify matching teams shown
  // Verify non-matching hidden
  // Clear filters
  // Verify all teams shown
});
```

#### Flow 3: Sort Teams
```typescript
test('should sort teams by name, created, and updated', async ({ page }) => {
  // Change sort field
  // Verify order
  // Toggle sort direction
  // Verify reversed order
});
```

#### Flow 4: Delete Team
```typescript
test('should delete team with confirmation', async ({ page }) => {
  // Open team menu
  // Click delete
  // Confirm in dialog
  // Verify team removed
  // Verify toast notification
});
```

#### Flow 5: Duplicate Team
```typescript
test('should duplicate team and navigate to editor', async ({ page }) => {
  // Open team menu
  // Click duplicate
  // Verify navigation to editor
  // Verify team name has "(Copy)" suffix
  // Verify toast notification
});
```

#### Flow 6: View Mode Toggle
```typescript
test('should switch between grid and list view', async ({ page }) => {
  // Verify default grid view
  // Click list view button
  // Verify list layout
  // Click grid view button
  // Verify grid layout
});
```

#### Flow 7: Empty States
```typescript
test('should show empty state when no teams', async ({ page }) => {
  // Mock empty teams response
  // Verify "No teams yet" message
  // Verify "Create Your First Team" CTA
});

test('should show no results state when filters match nothing', async ({ page }) => {
  // Apply filters with no matches
  // Verify "No teams found" message
  // Verify "Clear Filters" option
});
```

#### Flow 8: Create Team Navigation
```typescript
test('should navigate to create new team', async ({ page }) => {
  // Click "Create New Team" button
  // Verify navigation to /team-builder/new
});
```

**MSW Mocking:**
Use existing MSW proxy pattern, add handlers to `/apps/pokehub-app-e2e/src/mocks/handlers.ts`:
```typescript
http.get(`${API_URL}/teams`, () => HttpResponse.json(mockTeams))
http.post(`${API_URL}/teams`, async ({ request }) => { ... })
http.delete(`${API_URL}/teams/:id`, () => new HttpResponse(null, { status: 204 }))
```

---

## 4. TEST UTILITIES

### File: `/packages/frontend/pokehub-team-builder/src/test-utils/team-viewer-test-utils.ts`

**Create shared utilities:**

```typescript
// Mock data factories
export function createMockTeam(overrides?: Partial<PokemonTeam>): PokemonTeam {
  return {
    id: 'team-123',
    userId: 'user-123',
    name: 'Test Team',
    generation: 9,
    format: 'ou',
    pokemon: [createMockPokemon()],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    ...overrides
  };
}

export function createMockPokemon(overrides?: Partial<PokemonInTeam>): PokemonInTeam {
  // Return mock Pokemon with sensible defaults
}

// Render helpers
export function renderWithTeamViewerProvider(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={testQueryClient}>
      <TeamViewerProvider>
        {ui}
      </TeamViewerProvider>
    </QueryClientProvider>
  );
}
```

---

## 5. CRITICAL EDGE CASES

**Network Failures:**
- API returns 500 → show error state with retry
- Network timeout → show error message
- 401 Unauthorized → redirect to login

**Empty Data:**
- No teams → empty state
- No filtered results → no results state
- Team with 0 Pokemon → handle gracefully

**Data Validation:**
- Missing team fields → display defaults
- Invalid generation → fallback handling
- Malformed Pokemon data → error boundary

**Race Conditions:**
- Multiple deletes simultaneously
- Filter changes during loading
- Duplicate mutations

**Long Data:**
- Team names > 50 chars → truncate
- 100+ teams → verify performance
- Very long Pokemon names → truncate

---

## IMPLEMENTATION ORDER

1. **Document Plan** - Copy this plan to `docs/plans/team-viewer-testing-plan.md` for permanent documentation
2. **Test Utilities** - Create mock factories first (team-viewer-test-utils.ts)
3. **Hook Tests** - Test filtering logic (useFilteredTeams.spec.ts)
4. **Context Tests** - Test state management (team-viewer.provider.spec.tsx)
5. **Component Tests** - Test individual components:
   - delete-team-dialog.spec.tsx
   - team-card.spec.tsx
   - team-list-item.spec.tsx
   - team-viewer.spec.tsx
6. **Integration Tests** - Test complete flows (team-viewer.integration.spec.tsx)
7. **E2E Tests** - Test user journeys (team-viewer.spec.ts)
8. **API Tests** - Extend existing useTeams.spec.tsx

---

## SUCCESS CRITERIA

- [ ] All unit tests pass with >80% code coverage
- [ ] Integration tests verify complete data flow
- [ ] E2E tests cover all critical user journeys
- [ ] All edge cases handled gracefully
- [ ] Tests follow existing codebase patterns
- [ ] Mock data factories reduce test duplication
- [ ] Tests are maintainable and well-documented

---

## KEY FILES TO CREATE/MODIFY

**New Files (9):**
1. `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/team-viewer.spec.tsx`
2. `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/components/team-card.spec.tsx`
3. `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/components/team-list-item.spec.tsx`
4. `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/components/delete-team-dialog.spec.tsx`
5. `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/hooks/useFilteredTeams.spec.ts`
6. `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/context/team-viewer.provider.spec.tsx`
7. `/packages/frontend/pokehub-team-builder/src/lib/team-viewer/team-viewer.integration.spec.tsx`
8. `/packages/frontend/pokehub-team-builder/src/test-utils/team-viewer-test-utils.ts`
9. `/apps/pokehub-app-e2e/src/team-viewer.spec.ts`

**Modified Files (1):**
1. `/apps/pokehub-app-e2e/src/mocks/handlers.ts` - Add team viewer MSW handlers

---

## ESTIMATED EFFORT

- **Unit Tests:** ~4-6 hours (8 test files)
- **Integration Tests:** ~1-2 hours (1 test file)
- **E2E Tests:** ~2-3 hours (1 test file with 8 flows)
- **Test Utilities:** ~1 hour
- **Total:** ~8-12 hours

This comprehensive testing plan ensures the Team Viewer feature is thoroughly tested at all levels, following the established patterns in the PokeHub codebase.
