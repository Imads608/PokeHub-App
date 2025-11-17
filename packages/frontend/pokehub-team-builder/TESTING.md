# Team Builder Test Documentation

## Overview
Comprehensive test suite for the Pokemon Team Builder feature with **241 tests** across **11 test suites**.

## Test Coverage Summary

### Team Builder Package (212 tests)

| File | Tests | What It Tests |
|------|-------|---------------|
| **useTeamChanges.spec.ts** | 27 | Team change detection, `arePokemonEqual` comparison, save/reset state |
| **pokemon-editor.spec.tsx** | 10 | Editor tabs, cancel/save buttons, tab navigation |
| **basic-tab.spec.tsx** | 23 | Nickname, level, ability, item, nature inputs |
| **moves-tab.spec.tsx** | 20 | Move selection, learnset integration, 4 move slots |
| **evs-tab.spec.tsx** | 20 | EV distribution, 510 total limit, stat inputs |
| **ivs-tab.spec.tsx** | 21 | IV values, Max All/Trick Room presets |
| **searchable-select.spec.tsx** | 40 | Debounced search, infinite scroll, filtering, custom renders |
| **pokemon-card.spec.tsx** | 24 | Pokemon display, validation errors, edit/remove actions |
| **team-configuration-section.spec.tsx** | 29 | Team config, save flow, generation changes, validation |
| **team-editor.spec.tsx** | 15 | Main integration: slot management, dialogs, Pokemon flow |

### Pokemon Static Data Package (29 tests)

| File | Tests | What It Tests |
|------|-------|---------------|
| **team-type-coverage.spec.ts** | 29 | Defensive coverage (9), Offensive coverage (10), Team summary (10) |

## Key Test Patterns

### Mocking Strategy
```typescript
// Lazy-loaded libraries (avoid static imports)
jest.mock('@pokehub/frontend/dex-data-provider');
const { getStats } = jest.requireMock('@pokehub/frontend/dex-data-provider') as {
  getStats: jest.Mock;
};

// Context mocking
jest.mock('../context/team-editor.context', () => ({
  useTeamEditorContext: () => ({
    teamName: { value: 'My Team', setValue: mockSetTeamName },
    // ... other context values
  }),
}));
```

### Test Setup Requirements
- **Pointer capture polyfills** for Radix UI components (test-setup.ts)
- **ResizeObserver mock** for layout components
- **Tabs wrapper** for TabsContent components

### Common Test Scenarios

#### Component Tests
- Rendering elements and initial state
- User interactions (clicks, input changes)
- Validation and error display
- Callback verification

#### Integration Tests
- Dialog open/close flows
- Multi-step user journeys
- State management across components

#### Calculation Tests
- Edge cases (empty data, max values)
- Mathematical accuracy
- Sorting and filtering logic

## Team Analysis Calculations

### Defensive Coverage
- **Weaknesses**: Types that hit multiple team members
- **Resistances**: Types multiple team members resist
- **Immunities**: Types team is immune to
- **Critical Weaknesses**: Types hitting 80%+ of team
- **Shared Weaknesses**: Types hitting 50-79% of team

### Offensive Coverage
- **Move Types**: Count by physical/special/status category
- **SE Coverage**: Types hit super-effectively
- **Coverage Gaps**: Types not covered
- **Cannot Hit**: Type immunities blocking moves
- **Resisted By**: Types resisting team's moves

### Team Summary Scoring
```
Overall Score = (Type Diversity × 0.3) + (Defensive Balance × 0.4) + (Offensive Balance × 0.3)
```
- **Type Diversity**: Unique move types / 18
- **Defensive Balance**: Resistances / Weaknesses (capped at 1.0)
- **Offensive Balance**: SE coverage / 18
- **Top Threats**: 3 most common weaknesses
- **Top Advantages**: 3 best defensive + offensive matchups

## Coverage Results

### Team Builder Components
- **Statements**: 95.12%
- **Branches**: 87.74%
- **Functions**: 91.01%
- **Lines**: 96.01%

### Team Analysis Calculations
- **100% coverage** across all calculation functions

## Running Tests

```bash
# All Team Builder tests
nx test frontend-pokehub-team-builder

# All Team Analysis tests
nx test frontend-pokemon-static-data

# Specific test file
nx test frontend-pokehub-team-builder --testFile=pokemon-card.spec.tsx

# With coverage
nx test frontend-pokehub-team-builder --coverage

# Watch mode
nx test frontend-pokehub-team-builder --watch
```

## Known Issues & Solutions

### Issue: Static imports of lazy-loaded libraries
**Solution**: Use `jest.requireMock()` instead of static imports
```typescript
// ❌ Don't do this
import { getStats } from '@pokehub/frontend/dex-data-provider';
const mockGetStats = jest.mocked(getStats);

// ✅ Do this
jest.mock('@pokehub/frontend/dex-data-provider');
const { getStats } = jest.requireMock('@pokehub/frontend/dex-data-provider') as {
  getStats: jest.Mock;
};
```

### Issue: hasPointerCapture not defined
**Solution**: Add polyfills in test-setup.ts
```typescript
Element.prototype.hasPointerCapture = jest.fn();
Element.prototype.setPointerCapture = jest.fn();
Element.prototype.releasePointerCapture = jest.fn();
```

### Issue: TabsContent requires Tabs wrapper
**Solution**: Wrap component in `<Tabs>` during testing
```typescript
const renderComponent = (props) => (
  <Tabs defaultValue="basic">
    <YourComponent {...props} />
  </Tabs>
);
```

## Test File Locations

```
packages/frontend/pokehub-team-builder/src/
├── lib/
│   ├── hooks/
│   │   └── useTeamChanges.spec.ts
│   └── team-editor/
│       ├── pokemon-card.spec.tsx
│       ├── team-configuration-section.spec.tsx
│       ├── team-editor.spec.tsx
│       └── pokemon-editor/
│           ├── basic-tab.spec.tsx
│           ├── evs-tab.spec.tsx
│           ├── ivs-tab.spec.tsx
│           ├── moves-tab.spec.tsx
│           ├── pokemon-editor.spec.tsx
│           └── searchable-select.spec.tsx
└── test-setup.ts

packages/frontend/pokemon-static-data/src/
└── lib/
    └── team-type-coverage.spec.ts
```
