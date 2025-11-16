# Team Builder Testing Progress

## Overview
Comprehensive test suite for the Team Builder feature, targeting Option C: Full Coverage.

**Current Status:** 59/~150+ tests passing (in progress)
**Coverage Goal:** 80%+ code coverage across all components

---

## ✅ Completed Test Files

### 1. `useTeamChanges.spec.ts` (27 tests - ALL PASSING)
**Location:** `src/lib/hooks/useTeamChanges.spec.ts`

**Coverage:**
- ✅ `arePokemonEqual` function (17 tests)
  - All Pokemon properties comparison
  - Moves array (order, length, content)
  - EVs/IVs deep comparison
  - Deep copy handling
- ✅ `useTeamChanges` hook (10 tests)
  - Change detection (team name, generation, format, tier)
  - Pokemon add/remove/modify
  - `markAsSaved`, `resetToSaved`, `getChanges`

**Code Coverage:** 97.43% statements, 93.65% branches, 100% functions

---

### 2. `pokemon-editor.spec.tsx` (10 tests - ALL PASSING)
**Location:** `src/lib/team-editor/pokemon-editor/pokemon-editor.spec.tsx`

**Coverage:**
- ✅ Rendering (3 tests)
  - All tabs render
  - Cancel and Add/Update buttons
  - Tab content panels
- ✅ Cancel Button (2 tests)
  - Calls onCancel when clicked
  - Does not call addPokemon
- ✅ Add/Update Button (2 tests)
  - Calls addPokemon when clicked
  - Does not call onCancel
- ✅ Tab Navigation (2 tests)
  - Switch between tabs
  - Default tab (Basic)
- ✅ Props (1 test)
  - Props passed to child components

**Mocking Strategy:**
- Mock tab components (BasicTab, MovesTab, EVsTab, IVsTab)
- Simple prop validation

---

### 3. `basic-tab.spec.tsx` (19/23 tests passing - 4 FAILING)
**Location:** `src/lib/team-editor/pokemon-editor/basic-tab.spec.tsx`

**Passing Tests:**
- ✅ Display current Pokemon values
- ✅ Nickname input (clear)
- ✅ Level slider display (all levels)
- ✅ Ability select (mount, placeholder)
- ✅ Item SearchableSelect (render, value, change, clear)
- ✅ Nature SearchableSelect (render, value, change)
- ✅ Data fetching (items, natures, abilities)

**Failing Tests (needs fixing):**
- ❌ "should render all form fields" - selector issue
- ❌ "should call setName when nickname is changed" - assertion issue
- ❌ "should have clear button for nature" - missing in mock
- ❌ "should render within TabsContent with value='basic'" - context issue

**Mocking Strategy:**
- Mock `useTeamEditorContext` (setLevel, setName, setAbility, setItem, setNature)
- Mock data providers (getItems, getNatures, getPokemonAbilitiesDetailsFromSpecies)
- Mock SearchableSelect component
- Wrap in `<Tabs>` for TabsContent context

**Issues Fixed:**
- Added ResizeObserver polyfill to test-setup.ts
- Wrapped BasicTab in Tabs component for proper context

---

## 🔄 In Progress

### Next Steps to Complete basic-tab.spec.tsx
1. Fix selector for "should render all form fields"
2. Fix assertion for "should call setName when nickname is changed"
3. Add clear button to nature SearchableSelect mock
4. Fix TabsContent context test

---

## ⏳ Remaining Test Files

### 4. `moves-tab.spec.tsx` (NOT STARTED)
**Location:** `src/lib/team-editor/pokemon-editor/moves-tab.spec.tsx`

**Planned Coverage:**
- Rendering 4 move slots
- Move selection per slot
- Duplicate move prevention
- Loading states
- Validation (at least one move required)
- SearchableSelect integration
- Move details display (type, category, power, accuracy, PP)

**Mocking Needed:**
- `useTeamEditorContext` (setMove)
- `usePokemonLearnset` (move data)
- `usePokemonMovesFromLearnset` (processed moves)
- `getMoveDetails` (move info)
- SearchableSelect component

**Estimated Tests:** ~20-25 tests

---

### 5. `evs-tab.spec.tsx` (NOT STARTED)
**Location:** `src/lib/team-editor/pokemon-editor/evs-tab.spec.tsx`

**Planned Coverage:**
- Render all 6 stat inputs (HP, Atk, Def, SpA, SpD, Spe)
- Slider and input sync
- 510 total EV limit validation
- 252 per-stat limit validation
- Progress bar display
- Generation-aware stat filtering
- EV distribution edge cases

**Mocking Needed:**
- `useTeamEditorContext` (setEV)
- `getStats` (generation-specific stats)
- `getStatName` (stat display names)

**Estimated Tests:** ~15-20 tests

---

### 6. `ivs-tab.spec.tsx` (NOT STARTED)
**Location:** `src/lib/team-editor/pokemon-editor/ivs-tab.spec.tsx`

**Planned Coverage:**
- Render all 6 stat inputs
- Slider and input sync
- 0-31 range validation
- Max All preset button (set all to 31)
- Trick Room preset button (Speed to 0, others to 31)
- Generation-aware stat filtering

**Mocking Needed:**
- `useTeamEditorContext` (setIV)
- `getStats`, `getStatName`

**Estimated Tests:** ~12-15 tests

---

### 7. `searchable-select.spec.tsx` (NOT STARTED)
**Location:** `src/lib/team-editor/pokemon-editor/searchable-select.spec.tsx`

**Planned Coverage:**
- Rendering with items
- Search/filter functionality
- Debounced search
- Item selection
- Auto-scroll to selected item
- Clear button (when provided)
- Loading state with skeleton
- Custom render functions (trigger, item)
- Infinite scroll pagination

**Mocking Needed:**
- None (test real component behavior)
- May need to mock `useInfiniteScroll` hook

**Estimated Tests:** ~15-20 tests

---

### 8. `team-editor.spec.tsx` (NOT STARTED - INTEGRATION)
**Location:** `src/lib/team-editor/team-editor.spec.tsx`

**Planned Coverage:**
- Full Pokemon edit flow (select → edit → save)
- Full Pokemon edit flow (select → edit → cancel)
- Team configuration changes
- Generation change with confirmation
- Add/Remove Pokemon from team
- Empty slot interaction
- Pokemon selector dialog
- Pokemon editor dialog
- Team analysis dialog

**Mocking Needed:**
- `useTeamEditorContext` (full context)
- Pokemon data providers
- Lazy-loaded components (PokemonSelector, PokemonEditor, TeamAnalysisDialog)

**Estimated Tests:** ~20-25 tests

---

### 9. `pokemon-card.spec.tsx` (NOT STARTED)
**Location:** `src/lib/team-editor/pokemon-card.spec.tsx`

**Planned Coverage:**
- Display Pokemon info (name, species, level, moves, ability, item)
- Validation error indicators (red border, icon, tooltip)
- Edit button
- Remove button
- Click interactions
- Validation state changes

**Mocking Needed:**
- `@pkmn/img` (Pokemon sprites)
- Validation result data
- Event handlers (onEdit, onRemove)

**Estimated Tests:** ~12-15 tests

---

### 10. `team-configuration-section.spec.tsx` (NOT STARTED)
**Location:** `src/lib/team-editor/team-configuration-section.spec.tsx`

**Planned Coverage:**
- Team name input
- Generation selector
- Format selector (Singles/Doubles)
- Tier selector
- Save button states (enabled/disabled)
- Generation lock when team has Pokemon
- Generation change confirmation dialog
- Team analysis button
- Validation summary display
- Toast notifications

**Mocking Needed:**
- `useTeamEditorContext` (team state, generation, format, tier, teamName)
- `useTeamChanges` (hasChanges, markAsSaved)
- `validateTeam`
- `useTiersStaticData`

**Estimated Tests:** ~18-22 tests

---

## Test Infrastructure

### Configuration Files
- ✅ `jest.config.ts` - Jest configuration with 70% coverage threshold
- ✅ `test-setup.ts` - Global test setup
- ✅ `project.json` - Test target configuration

### Global Mocks & Polyfills (test-setup.ts)
- ✅ `@testing-library/jest-dom` - DOM matchers
- ✅ `TextEncoder`/`TextDecoder` - Text encoding polyfills
- ✅ `ResizeObserver` - Resize observer mock

### Common Patterns

**Mocking Context:**
```typescript
jest.mock('../../context/team-editor.context', () => ({
  useTeamEditorContext: () => ({
    activePokemon: { setLevel, setName, ... },
    generation: { value: 9 },
  }),
}));
```

**Mocking Data Providers:**
```typescript
jest.mock('@pokehub/frontend/dex-data-provider', () => ({
  getItems: jest.fn(() => [...]),
  getNatures: jest.fn(() => [...]),
}));
```

**Component Wrapper for Tabs:**
```typescript
const renderComponent = (props) => {
  return render(
    <Tabs defaultValue="basic">
      <Component {...props} />
    </Tabs>
  );
};
```

---

## Known Issues & Solutions

### Issue 1: ResizeObserver not defined
**Solution:** Add ResizeObserver mock to test-setup.ts
```typescript
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

### Issue 2: TabsContent requires Tabs wrapper
**Solution:** Wrap component in `<Tabs>` during testing

### Issue 3: SearchableSelect complexity
**Solution:** Mock SearchableSelect in parent component tests, test separately in its own spec file

---

## Coverage Goals

**Target Coverage:**
- Statements: 80%+
- Branches: 70%+
- Functions: 80%+
- Lines: 80%+

**Critical Path Coverage (100%):**
- Cancel functionality
- Save functionality
- Validation

**Current Coverage (partial):**
- useTeamChanges: 97.43% statements

---

## Running Tests

```bash
# Run all tests
nx test frontend-pokehub-team-builder

# Run specific test file
nx test frontend-pokehub-team-builder --testFile=useTeamChanges.spec.ts

# Run with coverage
nx test frontend-pokehub-team-builder --coverage

# Run in watch mode
nx test frontend-pokehub-team-builder --watch
```

---

## Notes for Continuation

If implementation is interrupted:

1. **Fix basic-tab.spec.tsx failures first** (4 tests)
2. **Continue with moves-tab.spec.tsx** (most complex tab)
3. **Then evs-tab and ivs-tab** (similar patterns)
4. **searchable-select.spec.tsx** (shared component - high value)
5. **Integration tests last** (team-editor, pokemon-card, team-configuration-section)

**Time Estimates:**
- Fix basic-tab: 10-15 minutes
- Each tab test: 20-30 minutes
- SearchableSelect: 30-40 minutes
- Integration tests: 30-40 minutes each

**Total Remaining:** ~3-4 hours of work
