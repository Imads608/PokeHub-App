# Team Builder Feature Documentation

## Overview

The Team Builder feature allows users to create and customize competitive Pokemon teams. It provides an intuitive interface for configuring Pokemon stats, moves, abilities, items, and other battle-relevant attributes.

**Status**: In Development (Core editing complete, validation implemented, team analysis implemented, backend persistence implemented - frontend integration pending)

---

## Team Viewer

The Team Viewer is the main entry point for the `/team-builder` route, displaying all user teams with filtering, sorting, and management capabilities.

### Features

- **View Teams**: Display all user teams in grid or list view
- **Search**: Filter teams by name (case-insensitive)
- **Filter**: By generation and format
- **Sort**: By name, created date, or updated date (ascending/descending)
- **Actions**: Create, edit, duplicate, and delete teams
- **View Modes**: Toggle between grid and list layouts

### Component Structure

```
team-viewer/
├── team-viewer.tsx                    # Main viewer container with filters
├── components/
│   ├── team-card.tsx                  # Grid view team card
│   ├── team-list-item.tsx             # List view team item
│   └── delete-team-dialog.tsx         # Deletion confirmation dialog
├── context/
│   ├── team-viewer.context.ts         # Context definition
│   ├── team-viewer.context.model.ts   # TypeScript types
│   └── team-viewer.provider.tsx       # Provider with state management
└── hooks/
    └── useFilteredTeams.ts            # Client-side filtering/sorting logic
```

### State Management

**Context**: `TeamViewerFiltersContext` provides filter state:

```typescript
interface TeamViewerFiltersState {
  searchTerm: string;                    // Team name search
  selectedGeneration: GenerationNum | 'all';
  selectedFormat: string | 'all';
  sortBy: 'created' | 'updated' | 'name';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
}
```

**Key Methods**:
- `setSearchTerm(term)` - Update search filter
- `setSelectedGeneration(gen)` - Filter by generation
- `setSelectedFormat(format)` - Filter by format
- `setSortBy(field)` - Change sort field
- `toggleSortOrder()` - Toggle asc/desc
- `toggleViewMode()` - Switch between grid/list
- `resetFilters()` - Clear all filters
- `hasActiveFilters` - Computed: true if any filter is active

### Data Fetching

Uses `useUserTeams()` hook with server-side prefetch:

```typescript
// Hook (client-side)
export function useUserTeams() {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: teamsKeys.all,
    queryFn: async () => {
      return withAuthRetryWithoutResponse(
        session!.accessToken,
        (token) => getUserTeams(token)
      );
    },
    enabled: !!session?.accessToken,
    staleTime: 30000, // 30 seconds
  });
}
```

**Server-Side Prefetch** (see [Data Fetching Patterns](../data-fetching-patterns.md#server-side-prefetch-with-hydrationboundary)):

```typescript
// app/team-builder/page.tsx
export default async function TeamBuilderPage() {
  const session = await auth();
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: teamsKeys.all,
    queryFn: () => getUserTeams(session.accessToken),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamViewerProvider>
        <TeamViewer />
      </TeamViewerProvider>
    </HydrationBoundary>
  );
}
```

### Client-Side Filtering

The `useFilteredTeams` hook performs filtering and sorting on the client:

```typescript
export function useFilteredTeams(teams: TeamResponseDTO[]) {
  const { searchTerm, selectedGeneration, selectedFormat, sortBy, sortOrder } =
    useTeamViewerFilters();

  return useMemo(() => {
    let filtered = [...teams];

    // Search filter (case-insensitive)
    if (searchTerm) {
      filtered = filtered.filter((team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Generation filter
    if (selectedGeneration !== 'all') {
      filtered = filtered.filter((team) => team.generation === selectedGeneration);
    }

    // Format filter
    if (selectedFormat !== 'all') {
      filtered = filtered.filter((team) => team.format === selectedFormat);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [teams, searchTerm, selectedGeneration, selectedFormat, sortBy, sortOrder]);
}
```

### Team Actions

#### Duplicate Team

1. Calls `useCreateTeam()` with modified team data
2. Appends "(Copy)" to team name
3. Navigates to `/team-builder/[newTeamId]` on success
4. Shows toast notification

```typescript
const handleDuplicate = async (team: TeamResponseDTO) => {
  const newTeam = await createTeam.mutateAsync({
    ...team,
    name: `${team.name} (Copy)`,
  });
  router.push(`/team-builder/${newTeam.id}`);
  toast.success('Team duplicated');
};
```

#### Delete Team

1. Opens confirmation dialog with team name
2. Calls `useDeleteTeam()` on confirm
3. Cache automatically invalidates
4. Shows toast notification

```typescript
const handleDelete = async (teamId: string) => {
  await deleteTeam.mutateAsync(teamId);
  setDeleteDialogOpen(false);
  toast.success('Team deleted');
};
```

### UI Components

#### TeamCard (Grid View)

- Team name with generation/format badges
- Pokemon sprites (up to 6) using `@pkmn/img`
- Last updated timestamp (relative, e.g., "2 hours ago")
- Dropdown menu: Edit, Duplicate, Delete
- Click card to navigate to editor

#### TeamListItem (List View)

- Horizontal layout with Pokemon sprites inline
- Team name and metadata
- Action buttons visible on hover
- Same actions as TeamCard

#### DeleteTeamDialog

- AlertTriangle icon for destructive action
- Shows team name for confirmation
- Cancel and Delete buttons
- Disabled state during deletion

### Empty States

**No Teams**:
```tsx
<Card>
  <h3>No teams yet</h3>
  <p>Create your first team to get started</p>
  <Button onClick={() => router.push('/team-builder/new')}>
    Create Your First Team
  </Button>
</Card>
```

**No Filtered Results**:
```tsx
<Card>
  <h3>No teams found</h3>
  <p>No teams match your current filters</p>
  <Button onClick={resetFilters}>Clear Filters</Button>
</Card>
```

### Test IDs

For reliable E2E testing (see [E2E Test Reliability](../development/e2e-test-reliability-fixes.md)):

```typescript
// Containers
data-testid="teams-grid"
data-testid="teams-list"

// Team cards/items
data-testid={`team-card-${team.id}`}
data-testid={`team-card-menu-${team.id}`}
data-testid={`team-card-edit-${team.id}`}
data-testid={`team-card-duplicate-${team.id}`}
data-testid={`team-card-delete-${team.id}`}

// List view
data-testid={`team-list-item-${team.id}`}
data-testid={`team-list-edit-${team.id}`}
data-testid={`team-list-duplicate-${team.id}`}
data-testid={`team-list-delete-${team.id}`}

// Dialogs
data-testid="delete-team-dialog"
data-testid="delete-team-cancel"
data-testid="delete-team-confirm"

// Filters
data-testid="search-input"
data-testid="generation-filter"
data-testid="format-filter"
data-testid="sort-filter"
data-testid="sort-order-toggle"
data-testid="clear-filters-button"
data-testid="no-results-clear-filters"
```

---

## Team Editor

## Architecture

### Component Structure

```
team-editor/
├── team-editor.tsx                 # Main team editor container
├── pokemon-editor/
│   ├── pokemon-editor.tsx          # Tab container and dialog footer
│   ├── basic-tab.tsx               # Basic Pokemon info (level, ability, item, nature)
│   ├── moves-tab.tsx               # Move selection (4 slots)
│   ├── evs-tab.tsx                 # EV distribution (510 total, 252 max per stat)
│   ├── ivs-tab.tsx                 # IV configuration (0-31 per stat)
│   └── searchable-select.tsx       # Shared searchable dropdown component
├── pokemon-selector/
│   └── pokemon-selector.tsx        # Pokemon species selection
└── context/
    ├── team-editor.context.tsx     # Global team editor state
    └── team-editor.context.model.ts
```

### State Management

**Context**: `TeamEditorContext` provides centralized state management for:
- Team metadata (name, format, generation)
- Active Pokemon being edited
- Pokemon in team (dynamic array, up to 6)

**Validation Context**: `TeamValidationContext` provides validation state:
- Validation results and errors
- Team-level and Pokemon-level error retrieval
- Validation ready state

**Key Methods**:
- `setActivePokemon(pokemon)` - Set the Pokemon being edited
- `setLevel(level)` - Update Pokemon level
- `setAbility(ability)` - Update Pokemon ability
- `setItem(item)` - Update held item
- `setNature(nature)` - Update nature
- `setMove(index, move)` - Update move at specific slot (0-3)
- `setEV(stat, value)` - Update EV for specific stat (validates 510 total, 252 max)
- `setIV(stat, value)` - Update IV for specific stat (validates 0-31 range)
- `clearTeam()` - Reset all Pokemon slots to undefined
- `hasAnyPokemon()` - Check if team has any Pokemon

### Data Flow

1. User selects Pokemon species → `setActivePokemon(species)` creates new Pokemon
2. User edits in tabs → Context methods update `activePokemon`
3. On save → Active Pokemon added to team array
4. Generation changes → All dropdowns/stats refresh for that generation

## Implemented Features

### 1. Basic Tab ✅

**Purpose**: Configure fundamental Pokemon attributes

**Fields**:
- **Nickname**: Text input (optional, max 12 characters, defaults to species name)
- **Level**: Slider + input (1-100)
- **Ability**: Select dropdown with description
  - Shows abilities available to species
  - Displays ability descriptions
- **Item**: Searchable popover with icons
  - Item sprites from `@pkmn/img`
  - Item descriptions
  - "None" option to clear
  - Auto-scroll to selected item
- **Nature**: Searchable popover
  - Nature stat modifiers shown
  - Auto-scroll to selected nature

**Key Features**:
- All selects use consistent `SearchableSelect` component
- Item dropdown width: 400px
- Ability select width: 400px
- Proper alignment across all fields

### 2. Moves Tab ✅

**Purpose**: Select up to 4 moves from Pokemon's learnset

**Features**:
- **4 move slots** in 2-column grid
- **Searchable dropdown** for each slot
- **Generation-aware learnset** - Uses `usePokemonLearnset` and `usePokemonMovesFromLearnset`
- **Loading states** - Skeleton shimmer while fetching moves
- **Duplicate prevention** - Cannot select the same move more than once
  - Each slot filters out moves selected in other slots
  - Cleared moves become available again
- **Inline validation** - Error alert when no moves selected
- **Rich move display**:
  - Type badge with color
  - Category (Physical/Special/Status)
  - Base Power (if applicable)
  - Accuracy
  - PP
  - Move description
- **Auto-scroll** to selected move
- **Dropdown width**: 550px (wider to accommodate move details)

**Technical Details**:
- Uses `SearchableSelect` component
- Type colors from `@pokehub/frontend/shared-utils`
- Loading state tracked via `isLoading` prop
- Check icon matches other tabs' styling
- `getAvailableMovesForSlot()` filters duplicates per slot
- `hasAtLeastOneMove()` validates move requirement

### 3. EVs Tab ✅

**Purpose**: Distribute Effort Values across stats

**Features**:
- **Progress bar** showing total EVs (0/510)
- **Per-stat controls**:
  - Slider (0-252, step of 4)
  - Number input for precise values
  - Current/Max display (e.g., "128/252")
- **Validation**:
  - Maximum 510 total EVs
  - Maximum 252 per stat
  - Auto-caps when limits reached
- **Generation-aware**:
  - Only shows stats that exist in generation
  - Filters out stats with names in brackets (e.g., "[Special Defense]" in Gen 1)
  - Gen 1: HP, Attack, Defense, Speed, Special
  - Gen 2+: HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed

**Technical Details**:
- Uses `getStats(generation)` to determine available stats
- Uses `getStatName(statId, generation)` for display names
- Filters stats where name starts with `[`
- Step of 4 on slider (standard for competitive play)

### 4. IVs Tab ✅

**Purpose**: Configure Individual Values (genetic stats)

**Features**:
- **Per-stat controls**:
  - Slider (0-31, step of 1)
  - Number input for precise values
  - Current/Max display (e.g., "31/31")
- **Quick presets**:
  - **Max All**: Sets all IVs to 31 (perfect IVs)
  - **Trick Room**: Speed to 0, all others to 31
- **Generation-aware**: Same stat filtering as EVs tab
- **Single state update**: Preset buttons update all IVs in one operation to avoid race conditions

**Technical Details**:
- Validation: 0-31 range per stat
- Preset buttons use `setValue` to update all stats atomically
- No total limit (unlike EVs)

## Cancel Functionality ✅

### Overview

The Pokemon Editor includes smart cancel functionality that discards unsaved changes when the user cancels editing.

### Implementation

**State Management**:
- `pokemonSnapshot` - Stores a deep copy of the Pokemon before editing begins
- Snapshot captured in `onPokemonSelected` when editor opens
- Includes all properties: species, ability, item, nature, moves, EVs, IVs

**Change Detection**:
- Uses `arePokemonEqual` from `useTeamChanges` hook
- Deep comparison of all Pokemon properties
- Only shows warning when actual changes exist

**User Experience**:
1. **No changes made**:
   - User clicks Cancel or X button → Dialog closes immediately
   - No warning shown (seamless experience)

2. **Changes made**:
   - User clicks Cancel or X button → Confirmation dialog appears
   - Message: "You have unsaved changes. Are you sure you want to discard them?"
   - **Confirm** → Changes discarded, Pokemon restored to snapshot, dialog closes
   - **Cancel** → Dialog stays open, changes preserved

**Dialog Behavior**:
- Both Cancel button and X (close) button use same `onCancelEdit` logic
- `handleDialogOpenChange` intercepts dialog close events
- Consistent behavior across all close mechanisms

**Code Flow**:
```typescript
// 1. Save snapshot when editor opens
onPokemonSelected(pokemon) → setPokemonSnapshot(deepCopy(pokemon))

// 2. User makes changes → activePokemon updated via context

// 3. User clicks Cancel/X → onCancelEdit()
//    - Check: arePokemonEqual(snapshot, activePokemon)
//    - If different: show confirmation
//    - If confirmed: activePokemon.setValue(snapshot)

// 4. Dialog closes, snapshot cleared
```

### Technical Details

**Deep Copy Implementation**:
```typescript
setPokemonSnapshot({
  ...pokemonInTeam,
  moves: [...pokemonInTeam.moves],      // Clone moves array
  evs: { ...pokemonInTeam.evs },         // Clone EVs object
  ivs: { ...pokemonInTeam.ivs },         // Clone IVs object
});
```

**Files Modified**:
- `pokemon-editor.tsx` - Added `onCancel` prop and wired Cancel button
- `team-editor.tsx` - Added snapshot state, change detection, handlers
- `useTeamChanges.ts` - Exported `arePokemonEqual` for reuse

**Reused Logic**:
- `arePokemonEqual(p1, p2)` - Deep comparison utility
  - Compares all basic properties (species, ability, item, nature, gender, level, name)
  - Compares moves array (order matters)
  - Compares EVs object (all 6 stats)
  - Compares IVs object (all 6 stats)

## Validation & Change Tracking ✅

### Team Validation System

**Purpose**: Ensure teams meet format requirements before saving

**Implementation**:
- **Zod Schemas** (`pokemon-team.validation.ts`):
  - `pokemonInTeamSchema` - Validates individual Pokemon
  - `pokemonTeamSchema` - Validates entire team

**Validation Rules**:
- **Required Fields**: Species, ability, nature must be non-empty
- **Team Name**: Required (min 1 character, max 50 characters)
- **Nickname**: Optional (max 12 characters, matching official Pokemon games Gen 6+)
- **Moves**: At least 1 move required (max 4)
- **EVs**: Total cannot exceed 510, max 252 per stat
- **IVs**: Must be 0-31 range
- **Level**: Must be 1-100

**Validation Functions**:
```typescript
validateTeam(team): ValidationResult
validatePokemon(pokemon, slotIndex): ValidationResult
getPokemonSlotErrors(result, slotIndex): ValidationError[]
getTeamLevelErrors(result): ValidationError[]
hasAtLeastOneMove(moves): boolean
```

### Change Tracking

**Purpose**: Detect unsaved changes to enable/disable Save button

**Hook**: `useTeamChanges(currentTeamState)`

**Features**:
- Deep comparison of team state vs. saved state
- Tracks all Pokemon properties (moves, EVs, IVs, etc.)
- Provides change list for debugging

**Returns**:
```typescript
{
  hasChanges: boolean           // True if team differs from saved state
  markAsSaved: () => void       // Update saved baseline after successful save
  resetToSaved: () => TeamState // Discard changes, return to saved state
  getChanges: string[]          // List of what changed
  savedState: TeamState         // The baseline for comparison
}
```

### UI Integration

**1. Save Button** (`team-configuration-section.tsx`)
- Disabled when:
  - No changes detected
  - Validation errors exist
  - Save operation in progress
- Tooltip explains why button is disabled
- Shows loading spinner during save
- Validates before allowing save attempt

**2. Validation Summary Component**
- Displays all validation errors above Save button
- Groups errors by Pokemon slot (e.g., "Slot 1 (Pikachu)")
- Shows team-level errors separately
- Only visible when validation fails

**3. Pokemon Card Indicators**
- **Red border** when Pokemon has validation errors
- **AlertCircle icon** next to Pokemon name
- **Tooltip** shows all errors on hover
- Provides immediate visual feedback

**4. Inline Tab Validation**
- Moves tab shows alert when no moves selected
- Errors appear contextually where they occur

### Generation Protection

**Purpose**: Prevent accidental team loss when switching generations

**Features**:
- **Generation Lock**: Cannot change generation when team has Pokemon
- **Confirmation Dialog**: Warns user that team will be cleared
  - Explains why clearing is necessary (moves/abilities vary by generation)
  - Shows target generation
  - Requires explicit "Clear Team & Change Generation" action
- **Success Feedback**: Toast notification confirms generation change
- **Free Changes**: Generation can be changed freely when team is empty

**Context Methods**:
- `clearTeam()` - Resets all 6 Pokemon slots to undefined
- `hasAnyPokemon()` - Returns true if any slot has a Pokemon

## Team Building UX Evolution ✅

### UI Architecture Change: Sequential Pokemon Addition

**Previous Design** (6 Slots Approach):
- 6 empty slots displayed upfront
- Users could click any slot to add a Pokemon
- All slots visible regardless of whether they contained Pokemon
- Parallel editing workflow

**Current Design** (One-at-a-Time Approach):
- Pokemon added sequentially through Pokemon Selector
- Only shows Pokemon cards that have been added to the team
- Cleaner, less overwhelming interface
- Focused editing workflow

**Implementation Details**:

**1. Pokemon Addition Flow**:
```
1. User clicks "Add Pokemon" button
   ↓
2. Pokemon Selector dialog opens
   ↓
3. User searches and selects species
   ↓
4. Pokemon Editor dialog opens with tabs
   ↓
5. User configures Pokemon (moves, EVs, IVs, etc.)
   ↓
6. User clicks "Add to Team"
   ↓
7. Pokemon added to next available slot (0-5)
   ↓
8. Pokemon card appears in team grid
```

**2. Team Display**:
- **Dynamic Grid**: Only shows cards for added Pokemon
- **Empty State**: When team is empty, shows "Add Pokemon" button
- **6 Pokemon Maximum**: Button disabled when team is full
- **Visual Feedback**: Cards appear with smooth transitions

**3. Pokemon Editing**:
- **Click Pokemon Card**: Opens Pokemon Editor with existing Pokemon data
- **Edit Mode**: All tabs populated with current values
- **Save Changes**: Updates Pokemon in current slot
- **Cancel**: Discards changes and restores original Pokemon

**4. Pokemon Management**:
- **Remove Pokemon**: X button on Pokemon card removes from team
- **Slot Preservation**: Removed Pokemon leaves empty slot
- **Re-add**: Can add new Pokemon to empty slot

**Benefits of New Approach**:
- **Reduced Cognitive Load**: Users focus on one Pokemon at a time
- **Cleaner Interface**: No empty slot clutter
- **Better Mobile Experience**: Less scrolling, more focused
- **Progressive Disclosure**: Information revealed as needed
- **Validation Clarity**: Easier to see which Pokemon need attention

**Context State Management**:
```typescript
// Team pokemon array (dynamic array, up to 6)
const [pokemonTeam, setPokemonTeam] = useState<PokemonInTeam[]>([])

// Active pokemon being edited
const [activePokemon, setActivePokemon] = useState<PokemonInTeam | undefined>(undefined)

// Add Pokemon to team
const addActivePokemonToTeam = () => {
  if (!activePokemon) return
  if (pokemonTeam.length >= 6) return // Max 6 Pokemon

  setPokemonTeam([...pokemonTeam, activePokemon])
}

// Update Pokemon at specific index
const updatePokemonInTeam = (index: number, pokemon: PokemonInTeam) => {
  const newTeam = [...pokemonTeam]
  newTeam[index] = pokemon
  setPokemonTeam(newTeam)
}

// Remove Pokemon from team
const removePokemonFromTeam = (index: number) => {
  setPokemonTeam(pokemonTeam.filter((_, i) => i !== index))
}
```

**UI Components**:
- `team-editor.tsx` - Main container with dynamic Pokemon grid
- `pokemon-card.tsx` - Individual Pokemon display card
- `pokemon-selector.tsx` - Species selection dialog
- `pokemon-editor.tsx` - Comprehensive Pokemon configuration tabs

## Pokemon Showdown Integration ✅

### Overview

The Team Builder now integrates with **Pokemon Showdown**, the most popular competitive Pokemon battle simulator. This integration provides format-specific validation, rule enforcement, and ban lists to ensure teams comply with official competitive formats.

**Pokemon Showdown** defines:
- Battle formats (OU, UU, Ubers, VGC, etc.)
- Tier-based bans (Pokemon, moves, abilities, items)
- Clauses (Species Clause, Sleep Clause, etc.)
- Complex rules (Dynamax Clause, Evasion Clause, etc.)

### Architecture

**Key Components**:

1. **Format Selector** (`packages/frontend/pokehub-team-builder/src/lib/team-editor/team-configuration/format-selector.tsx`)
   - Unified format selection using searchable Combobox
   - Fetches formats from Pokemon Showdown API via `useFormats` hook
   - Groups formats by category (Singles, Doubles, VGC, etc.)
   - Supports search, collapsible categories, and caching via React Query
   - Examples of format IDs:
     - Gen 9 OU → `ou`
     - Gen 8 VGC 2021 → `vgc2021`
     - Gen 7 Ubers → `ubers`
   - Showdown format ID computed as `gen${generation}${formatId}` (e.g., `gen9ou`)

2. **Team Validator** (`packages/shared/pokemon-showdown-validation/src/lib/validator.ts`)
   - Validates teams against format rules
   - Checks banned Pokemon, moves, abilities, items
   - Returns detailed error messages
   - Uses `@pkmn/sim` under the hood

3. **Format Rules** (`packages/shared/pokemon-showdown-validation/src/lib/format-rules.ts`)
   - Retrieves format-specific restrictions
   - Parses ban lists from format data
   - Provides structured rule information

4. **Validation Context** (`team-validation-context/`)
   - Dedicated context for validation state
   - Automatic re-validation on team changes
   - Provides validation results to all components
   - Single source of truth for validation
   - Separated from team editor context for better organization

### Validation Flow

```typescript
// 1. User configures team metadata
generation.setValue(9)
format.setValue('ou') // Format ID from Pokemon Showdown (e.g., 'ou', 'vgc2024rege', 'nationaldex')

// 2. Context automatically computes Showdown format ID
const showdownFormatId = `gen${generation}${format}`
// Result: 'gen9ou'

// 3. Validation context validates team in real-time
const validationResult = validateTeam({
  name: teamName.value,
  generation: generation.value,
  format: format.value,
  pokemon: teamPokemon.value,
})

// 4. Components access validation from validation context
const validation = useTeamValidationContext()
const isValid = validation.isTeamValid
const errors = validation.getPokemonErrors(index)
```

### Format Rules Display Component

**Component**: `format-rules-display.tsx`

**Purpose**: Shows users what Pokemon, moves, abilities, and items are banned in the selected format

**Features**:
- **Dynamic Rule Loading**: Fetches rules based on `showdownFormatId`
- **Categorized Bans**: Separate sections for Pokemon, moves, abilities, items
- **Visual Design**: Card-based layout with Shield icon
- **Empty States**: Shows "No restrictions" when category is empty
- **Comprehensive Display**: Shows format name and complete ban lists

**UI Elements**:
```tsx
<FormatRulesDisplay
  showdownFormatId="gen9ou"
  generation={9}
/>
```

Displays:
```
Format Rules
OU (Gen 9)

🚫 Banned Pokemon
- Mewtwo
- Lugia
- ...

🚫 Banned Moves
- Baton Pass

🚫 Banned Abilities
- Moody
- Shadow Tag

🚫 Banned Items
- (No restrictions)
```

### Proactive Filtering

The integration includes **proactive filtering** to prevent users from selecting banned options:

**1. Pokemon Selector** (`pokemon-selector.tsx`)
- Fetches format bans using `useFormatBans` hook
- Filters banned Pokemon from search results
- Users cannot add banned Pokemon to their team

**2. Moves Tab** (`moves-tab.tsx`)
- Filters banned moves from move selection dropdown
- Only shows legal moves for the format
- Prevents selection of restricted moves

**3. Basic Tab** (`basic-tab.tsx`)
- Filters banned abilities from ability dropdown
- Filters banned items from item selection
- Prevents selection of restricted options

**Implementation**:
```typescript
// Hook for fetching format bans
const { bannedPokemon, bannedMoves, bannedAbilities, bannedItems } =
  useFormatBans(showdownFormatId, generation)

// Filter options
const legalMoves = moves.filter(move => !bannedMoves.includes(move.name))
const legalAbilities = abilities.filter(ab => !bannedAbilities.includes(ab.name))
const legalItems = items.filter(item => !bannedItems.includes(item.name))
```

### Dual Validation System

**Purpose**: Comprehensive validation combining structural checks and format-specific rules

The Team Builder uses **two complementary validation systems**:

**1. Zod Validation** (Configuration/Structure)
- **Package**: `@pokehub/shared/pokemon-types`
- **Purpose**: Validates Pokemon configuration and data integrity
- **Scope**: Pokemon-level errors (assigned to specific Pokemon slots)
- **Examples**:
  - Missing required fields (species, ability, nature)
  - Invalid ranges (EVs > 510, IVs > 31, level > 100)
  - Move requirements (at least 1 move)
  - Data type validation

**2. Pokemon Showdown Validation** (Format Rules)
- **Package**: `@pokehub/shared/pokemon-showdown-validation`
- **Purpose**: Validates against competitive format rules
- **Scope**: Team-level errors (unless Showdown provides explicit `(pokemon X)` slot markers)
- **Examples**:
  - Banned Pokemon (e.g., "Mewtwo is banned in OU")
  - Format clauses (e.g., "Species Clause violation")
  - Team size violations
  - Banned moves/abilities/items

**Error Assignment Strategy**:
- **Zod errors**: Always assigned to specific Pokemon slots (pokemonSlot set)
- **Showdown errors**: Only assigned to Pokemon when explicit slot markers exist
  - With marker: `"(pokemon 1) Pikachu's ability..."` → Assigned to slot 0
  - Without marker: `"Mewtwo is banned"` → Team-level error
- **Rationale**: Prevents incorrect error assignment with duplicate Pokemon (e.g., 2 Groudons)

**Validation Flow**:
```typescript
// 1. Run both validators
const zodResult = validateTeam({ ... })           // Zod validation
const showdownResult = validateTeamForFormat(...)  // Showdown validation

// 2. Merge errors with proper slot assignment
const mergedErrors = [
  ...zodResult.errors,                    // Zod: already has pokemonSlot
  ...showdownResult.pokemonResults,       // Showdown: slot-specific errors
  ...showdownResult.errors.filter(...)    // Showdown: team-level errors (no slot)
]

// 3. Components display by category
const teamErrors = errors.filter(e => e.pokemonSlot === undefined)
const pokemonErrors = errors.filter(e => e.pokemonSlot === index)
```

**Benefits**:
- **Comprehensive**: Catches both configuration issues and format violations
- **Clear separation**: Users understand which errors are format-specific vs configuration
- **Accurate**: Slot assignment only when reliable (prevents duplicate Pokemon bugs)
- **Single source**: Both validations merged in context, computed once

### Enhanced Validation UI

**Purpose**: Provide clear, actionable feedback on team validation status

**Previous Implementation**:
- Simple error list
- Always visible (even when valid)
- No visual hierarchy
- Difficult to parse multiple errors
- Ambiguous error categorization ("Team Issues" unclear)

**New Implementation** (`team-validation-summary.tsx`):

**1. Success State** ✅
```tsx
// Green alert when team is valid
<Alert variant="default" className="border-green-200 bg-green-50">
  <CheckCircle2 className="text-green-600" />
  <AlertTitle>Team Valid</AlertTitle>
  <AlertDescription>
    Your team passes all validation rules and is ready to save.
  </AlertDescription>
</Alert>
```

**2. Collapsible Error Display** 🔽
- **Expandable/Collapsible**: Users can hide error details
- **Persistent Summary**: Error count always visible
- **Smooth Transitions**: Chevron rotates when toggled
```tsx
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <Alert variant="destructive">
    <div className="flex items-center justify-between">
      <AlertTitle className="flex items-center gap-2">
        Validation Errors
        <Badge variant="destructive">{totalErrors} errors</Badge>
      </AlertTitle>
      <CollapsibleTrigger>
        <ChevronDown className={isOpen ? 'rotate-180' : ''} />
      </CollapsibleTrigger>
    </div>
    <CollapsibleContent>
      {/* Error details */}
    </CollapsibleContent>
  </Alert>
</Collapsible>
```

**3. Error Count Badges** 🔢
- Shows total error count in red badge
- Per-Pokemon error counts in individual badges
- Quickly see where problems exist

**4. Visual Hierarchy** 📊
- Team-level errors shown first (format issues, team composition)
- Pokemon-level errors grouped by slot
- Each Pokemon shows: "Slot X (PokemonName) - Y errors"
- Clear separation between error categories

**5. Categorized Errors**

Errors are now clearly categorized to help users understand the type of violation:

```
❌ Validation Errors [3 errors] 🔽

Format Rule Violations:           ← Showdown/format-specific rules
• Mewtwo is banned
• You may only bring up to 6 Pokémon

Pikachu [1 error]:                ← Pokemon configuration errors
• Pokemon must have at least one move

Charizard [1 error]:
• Total EVs cannot exceed 510
```

**Label Improvements**:
- **"Format Rule Violations"** (formerly "Team Issues") - Clearly indicates these are format-specific rules from Pokemon Showdown
- **Pokemon names** - Configuration errors specific to that Pokemon from Zod validation
- This distinction helps users understand:
  - Format rules are about what's allowed in the competitive format
  - Pokemon errors are about configuration/data validity

**Type Safety**:
```typescript
export interface TeamValidationSummaryProps {
  validationResult: TeamValidationState  // From context, not generic ValidationResult
  pokemonNames: string[]
}
```

### Performance Optimizations

**Problem**: Format rules and validation are heavy components that can slow initial render

**Solution**: Lazy loading with React.lazy() and Suspense

**1. Lazy Loaded Components**:
```typescript
// Lazy load heavy validation components
const FormatRulesDisplay = lazy(() =>
  import('./format-rules-display').then((module) => ({
    default: module.FormatRulesDisplay,
  }))
);

const TeamValidationSummary = lazy(() =>
  import('./team-validation-summary').then((module) => ({
    default: module.TeamValidationSummary,
  }))
);
```

**2. Loading Fallbacks**:

**Validation Summary Fallback**:
```tsx
<Alert className="border-blue-200 bg-blue-50">
  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
  <AlertTitle>Validating Team...</AlertTitle>
  <AlertDescription>
    Checking your team against format rules and restrictions
  </AlertDescription>
</Alert>
```

**Format Rules Fallback**:
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Shield className="h-5 w-5" />
      Format Rules
    </CardTitle>
    <CardDescription>Loading format restrictions...</CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-5/6" />
  </CardContent>
</Card>
```

**3. Suspense Boundaries**:
```tsx
<Suspense fallback={<ValidationSummaryFallback />}>
  <TeamValidationSummary
    validationResult={validation.state}
    pokemonNames={pokemonNames}
  />
</Suspense>

<Suspense fallback={<FormatRulesDisplayFallback />}>
  <FormatRulesDisplay
    showdownFormatId={validation.showdownFormatId}
    generation={generation.value}
  />
</Suspense>
```

**Benefits**:
- Initial bundle size reduced
- Validation components only loaded when needed
- User sees meaningful loading states
- Better perceived performance

### Single Source of Truth for Validation

**Problem**: Multiple components were independently computing validation (duplicate work)

**Previous Implementation**:
```typescript
// ❌ team-configuration-section.tsx
const validationResult = useMemo(() => {
  return validateTeam({ ... })
}, [...])

// ❌ team-editor.tsx
const validationResult = useMemo(() => {
  return validateTeam({ ... })
}, [...])

// ❌ pokemon-card.tsx
// Received validationResult as prop
```

**New Implementation** (Context-based):
```typescript
// ✅ team-validation.provider.tsx (SINGLE COMPUTATION)
const validation = useMemo(() => {
  const state = validateTeam({
    name: teamName.value,
    generation: generation.value,
    format: format.value,
    pokemon: teamPokemon.value,
  })

  return {
    state,
    getTeamErrors: () => getTeamLevelErrors(state),
    getPokemonErrors: (index: number) => getPokemonSlotErrors(state, index),
    isTeamValid: state.isValid,
    isReady: true,
  }
}, [teamName.value, generation.value, format.value, teamPokemon.value])

// ✅ All components use validation context
const validation = useTeamValidationContext()
const isValid = validation.isTeamValid
const errors = validation.getPokemonErrors(index)
```

**Benefits**:
- Performance: Validation computed once, not multiple times
- Consistency: All components see same validation state
- Maintainability: Single place to update validation logic
- Type Safety: Proper TypeScript types from context

### Type Improvements

**Previous Types**:
```typescript
// ❌ Generic, not context-aware
interface TeamValidationSummaryProps {
  validationResult: ValidationResult  // Generic type
  pokemonNames: string[]
}
```

**New Types**:
```typescript
// ✅ Context-specific, properly typed
import type { TeamValidationState } from '../context/team-editor.context.model'

interface TeamValidationSummaryProps {
  validationResult: TeamValidationState  // Context type
  pokemonNames: string[]
}
```

**Context Validation Type**:
```typescript
interface TeamValidationState {
  isValid: boolean
  errors: Array<{ field: string; message: string }>
  showdownFormatId: string
  timestamp: number
}
```

### Files Modified

**New Files**:
- `packages/frontend/pokehub-team-builder/src/lib/hooks/useFormatBans.ts` - Hook for fetching format bans
- `packages/frontend/pokehub-team-builder/src/lib/team-editor/format-rules-display.tsx` - Format rules UI component
- `packages/shared/pokemon-showdown-validation/src/lib/format-mapping.ts` - Format ID mapping
- `packages/shared/pokemon-showdown-validation/src/lib/format-rules.ts` - Format rules retrieval
- `packages/shared/pokemon-showdown-validation/src/lib/validator.ts` - Team validation logic

**Updated Files**:
- `team-editor.context.tsx` - Added centralized validation state
- `team-configuration-section.tsx` - Removed duplicate validation, added lazy loading
- `team-validation-summary.tsx` - Complete rewrite with enhanced UI
- `pokemon-selector.tsx` - Added proactive filtering for banned Pokemon
- `moves-tab.tsx` - Added filtering for banned moves
- `basic-tab.tsx` - Added filtering for banned abilities and items
- `team-editor.tsx` - Removed duplicate validation computation
- `pokemon-card.tsx` - Now uses validation from context instead of props

### Testing

**Test Updates**:
- All 212 tests passing ✅
- Mock context validation instead of mocking validateTeam
- Use mutable mock state with getters for dynamic values
- Updated prop types to match new interfaces

**Example Test Mock**:
```typescript
const mockValidationState = {
  isValid: true,
  errors: [],
  showdownFormatId: 'gen9ou',
  timestamp: Date.now(),
}

jest.mock('../context/team-editor.context', () => ({
  useTeamEditorContext: () => ({
    validation: {
      get state() {
        return mockValidationState
      },
      getTeamErrors: jest.fn(() => []),
      getPokemonErrors: jest.fn(() => []),
      get isTeamValid() {
        return mockValidationState.isValid
      },
      showdownFormatId: 'gen9ou',
    },
  }),
}))
```

### User Experience Impact

**Before**:
- No format-specific validation
- Could add banned Pokemon/moves/items
- Errors discovered only when trying to battle
- Generic error messages
- No guidance on format rules
- 6 empty slots always visible
- Overwhelming for new users

**After**:
- Proactive filtering prevents illegal selections
- Real-time validation against format rules
- Clear success/error states
- Collapsible error details
- Visible format rules display
- Better performance with lazy loading
- Consistent validation state across UI
- Clean one-at-a-time Pokemon addition flow
- Progressive disclosure of team composition

## Mobile Responsiveness ✅

### Pokemon Selector Mobile Optimization

The Pokemon Selector dialog is optimized for mobile screens to maximize the visible Pokemon results while still providing access to type filters.

**Problem Solved**: On mobile, the type filter badges (18 types) and type tabs would wrap across multiple rows, consuming most of the viewport and leaving minimal space for Pokemon results.

**Solution**: Collapsible filter system with horizontal scrolling.

#### Mobile Layout

**Default State (Filters Collapsed)**:
```
┌─────────────────────────┐
│ [Search...........] [⚙] │  ← Filter toggle button
├─────────────────────────┤
│ [Pkmn] [Pkmn]           │
│ [Pkmn] [Pkmn]           │
│ [Pkmn] [Pkmn]           │  ← Maximum space for results
│ [Pkmn] [Pkmn]           │
│ [Pkmn] [Pkmn]           │
└─────────────────────────┘
```

**Filters Expanded**:
```
┌─────────────────────────┐
│ [Search...........] [⚙] │
│ ←[Fire][Water][Grass]→  │  ← Horizontal scroll
├─────────────────────────┤
│ [Pkmn] [Pkmn]           │
│ [Pkmn] [Pkmn]           │
│ [Pkmn] [Pkmn]           │
└─────────────────────────┘
```

#### Implementation Details

**File**: `packages/frontend/pokehub-team-builder/src/lib/team-editor/pokemon-selector/pokemon-selector.tsx`

**Key Changes**:

1. **Mobile Filter Toggle State**:
```typescript
const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
```

2. **Filter Toggle Button** (visible only on mobile):
```tsx
<Button
  variant={isMobileFilterOpen ? 'secondary' : 'outline'}
  size="icon"
  className="lg:hidden"
  onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
>
  <Filter className="h-4 w-4" />
</Button>
```

3. **Desktop Type Badges** (hidden on mobile):
```tsx
<div className="hidden flex-wrap gap-2 lg:flex">
  {/* Type badges */}
</div>
```

4. **Mobile Type Badges** (collapsible, horizontal scroll):
```tsx
{isMobileFilterOpen && (
  <div className="lg:hidden">
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex w-max gap-2 p-1">
        {/* Type badges with shrink-0 */}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  </div>
)}
```

5. **Hide Tabs on Mobile**:
```tsx
<TabsList className="mb-4 hidden h-auto flex-wrap lg:flex">
```

6. **Flexible Height for Results**:
```tsx
<ScrollArea className="min-h-0 flex-1 lg:h-[calc(70vh-220px)]">
```

#### Horizontal ScrollArea Pattern

For horizontal scrolling with shadcn/ui ScrollArea, you must:

1. Import `ScrollBar` alongside `ScrollArea`:
```typescript
import { ScrollArea, ScrollBar } from '@pokehub/frontend/shared-ui-components';
```

2. Add `ScrollBar` with horizontal orientation inside the ScrollArea:
```tsx
<ScrollArea className="w-full whitespace-nowrap">
  <div className="flex w-max gap-2">
    {/* Items with shrink-0 */}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

3. Key classes:
   - `whitespace-nowrap` on ScrollArea - prevents content wrapping
   - `w-max` on inner container - allows content to extend beyond viewport
   - `shrink-0` on items - prevents items from shrinking

#### Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< lg` (mobile) | Filter toggle visible, badges collapsed, tabs hidden |
| `≥ lg` (desktop) | Full filter badges visible, tabs visible, no toggle |

## Performance Optimizations ⚡

### Overview

The Team Builder implements multiple optimization strategies to reduce First Load JS and improve Time to Interactive. These optimizations are critical for maintaining fast page loads while providing rich functionality.

### 1. Lazy Loading & Code Splitting

**Goal**: Reduce First Load JS by splitting heavy components into separate chunks that load on-demand.

#### Component Loading Strategy

**Tier 1: Critical Path (Loaded Immediately)**
- `TeamConfigurationSection` - Team metadata configuration
- `PokemonCard` - Display existing Pokemon
- `EmptySlot` - "Add Pokemon" button
- Essential UI components and context providers

**Tier 2: On-Demand Dialogs (Lazy Loaded)**
- `PokemonSelector` - Pokemon species selection (loads when user clicks "Add Pokemon")
- `PokemonEditor` - Pokemon configuration tabs (loads when editing/adding Pokemon)
- `TeamAnalysisDialog` - Team type coverage analysis (loads when user clicks "Analyze Team")

**Tier 3: Validation Components (Lazy Loaded)**
- `FormatRulesDisplay` - Format ban lists (loads within configuration section)
- `TeamValidationSummary` - Validation error display (loads within configuration section)

#### Implementation Details

**Dialog Components** (`team-editor.tsx`):

```typescript
// Lazy load dialog components for better performance
// webpackPrefetch tells the browser to prefetch these during idle time
const LazyPokemonSelector = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "pokemon-selection" */
    './pokemon-selector/pokemon-selector'
  ).then((mod) => ({
    default: mod.PokemonSelector,
  }))
);

const LazyPokemonEditor = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "pokemon-selection" */
    './pokemon-editor/pokemon-editor'
  ).then((mod) => ({
    default: mod.PokemonEditor,
  }))
);

const LazyTeamAnalysisDialog = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "team-analysis" */
    './team-analysis'
  ).then((mod) => ({
    default: mod.TeamAnalysisDialog,
  }))
);
```

**Webpack Magic Comments**:
- `webpackPrefetch: true` - Browser prefetches during idle time (no performance penalty)
- `webpackChunkName` - Named chunks for better debugging and cache control
- Related components grouped (e.g., `pokemon-selection` includes selector and editor)

**Suspense Boundaries**:

```tsx
{/* Pokemon Selector Dialog with loading fallback */}
<Dialog open={isPokemonSelectorOpen}>
  <DialogContent>
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Pokémon...</p>
        </div>
      }
    >
      <LazyPokemonSelector {...props} />
    </Suspense>
  </DialogContent>
</Dialog>

{/* Team Analysis - Silent loading (dialog not visible until opened) */}
<Suspense fallback={null}>
  <LazyTeamAnalysisDialog {...props} />
</Suspense>
```

**Validation Components** (`team-configuration-section.tsx`):

```typescript
const LazyFormatRulesDisplay = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "team-validation" */
    './format-rules-display'
  ).then((module) => ({ default: module.FormatRulesDisplay }))
);

const LazyTeamValidationSummary = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "team-validation" */
    './team-validation-summary'
  ).then((module) => ({ default: module.TeamValidationSummary }))
);

// Skeleton loading states provide visual feedback
<Suspense fallback={<ValidationSummaryFallback />}>
  <LazyTeamValidationSummary {...props} />
</Suspense>
```

### 2. Tree Shaking Optimization

**Problem**: `@pkmn/sim` dependencies were being included in routes that didn't use them, inflating bundle size across the entire application.

**Root Cause**: The `dex-data-provider` package exports both simple data utilities AND Pokemon Showdown simulation utilities. Without proper tree shaking configuration, bundlers couldn't determine which exports had side effects, resulting in conservative bundling that included everything.

**Solution**: Added `package.json` with `sideEffects: false` to `dex-data-provider` package.

**File**: `packages/frontend/dex-data-provider/package.json`

```json
{
  "name": "@pokehub/frontend/dex-data-provider",
  "version": "0.0.1",
  "type": "module",
  "sideEffects": false
}
```

**What `sideEffects: false` Does**:
- Tells webpack/bundlers that all modules in this package are "pure"
- Unused exports can be safely removed (tree shaken)
- Bundler can perform more aggressive dead code elimination
- Only imports that are actually used are included in final bundle

**Impact**:
- Routes using only basic dex data (types, abilities, items) don't include `@pkmn/sim`
- Pokemon Showdown validation code only loaded on Team Builder route
- Significant reduction in First Load JS for non-Team Builder routes
- Better code splitting across the application

**Example**:

```typescript
// Before: Both imports would include @pkmn/sim in bundle
import { getTypes } from '@pokehub/frontend/dex-data-provider'; // Simple data
import { validateTeam } from '@pokehub/frontend/dex-data-provider'; // Uses @pkmn/sim

// After: With sideEffects: false
// - Routes importing only getTypes don't get @pkmn/sim
// - Routes importing validateTeam get @pkmn/sim only when needed
// - Tree shaking removes unused exports automatically
```

### Benefits

**Lazy Loading Benefits**:
1. **Reduced Initial Bundle**: Dialogs only loaded when user opens them
2. **Faster Time to Interactive**: Critical path remains small and fast
3. **Better Caching**: Named chunks cached separately, unchanged chunks reused
4. **Intelligent Prefetching**: Components ready before user needs them (most of the time)
5. **Graceful Loading**: Skeleton screens prevent layout shifts

**Tree Shaking Benefits**:
1. **Smaller Bundles Application-Wide**: Other routes don't include unused Team Builder dependencies
2. **Better Code Splitting**: Clear boundaries between simple data and complex simulation
3. **Improved Build Performance**: Less code to process and bundle
4. **Future-Proof**: New exports automatically tree-shakeable

### Performance Metrics

**First Load JS Reduction**:
- Main bundle: Smaller by excluding dialog components
- Team Builder route: Only loads Team Builder-specific chunks
- Other routes: No longer include `@pkmn/sim` dependencies
- Named chunks: Enable efficient caching strategies

**User Experience Impact**:
- Page loads faster (smaller initial JS)
- Interactions feel snappy (components prefetched during idle)
- No jarring content shifts (skeleton loading states)
- Smooth transitions (Suspense boundaries)

## Team Analysis ✅

### Overview

The Team Analysis feature provides comprehensive insights into your team's type coverage, strengths, and weaknesses. It helps identify defensive vulnerabilities and offensive coverage gaps.

### Implementation

**Component**: `team-analysis-dialog.tsx`

**Features**:
- **Lazy Loaded**: Component loads on-demand for better performance
- **Tab-based Interface**: Organized into three analysis views
- **Real-time Analysis**: Updates as team composition changes

### Analysis Tabs

**1. Team Summary Tab**
- Overview of team composition
- Quick stats and metrics
- Pokemon count and diversity indicators

**2. Defensive Coverage Tab**
- Shows how your team handles different attacking types
- Identifies type weaknesses and resistances
- Highlights Pokemon vulnerable to specific types
- Color-coded threat levels

**3. Offensive Coverage Tab**
- Analyzes your team's attacking type coverage
- Shows which types you can hit effectively
- Identifies coverage gaps
- Highlights which Pokemon provide specific type coverage

### Technical Details

**Files**:
- `team-analysis-dialog.tsx` - Main dialog container with tabs
- `team-summary-tab.tsx` - Team overview and stats
- `defensive-coverage-tab.tsx` - Defensive type matchup analysis
- `offensive-coverage-tab.tsx` - Offensive type coverage analysis
- `team-type-coverage.ts` - Type coverage calculation utilities

**Opening the Analysis**:
```tsx
// From team-configuration-section.tsx
<Button onClick={() => setIsTeamAnalysisOpen(true)}>
  <BarChart3 className="mr-2 h-4 w-4" />
  Analyze Team
</Button>

// Button disabled when team has no Pokemon
disabled={!teamPokemon.hasAnyPokemon()}
```

**Type Coverage Utilities**:
- Calculates type effectiveness for all Pokemon in team
- Considers dual types and type interactions
- Provides aggregated team-wide coverage metrics

## Shared Components

### SearchableSelect

**Purpose**: Reusable searchable dropdown with consistent UX

**Features**:
- Debounced search
- Infinite scroll
- Auto-scroll to selected item (on open)
- Loading skeleton support
- Customizable:
  - Trigger content rendering
  - Item content rendering
  - Dropdown width
  - Filter function
  - Optional "None/Clear" button

**Props**:
```typescript
interface SearchableSelectProps<T> {
  id: string
  label: string
  placeholder: string
  value: string | undefined
  items: T[]
  onValueChange: (value: string) => void
  onClear?: () => void
  renderTriggerContent?: (item: T | undefined) => ReactNode
  renderItemContent?: (item: T, isSelected: boolean) => ReactNode
  filterItems?: (items: T[], searchTerm: string) => T[]
  dropdownWidth?: string  // default: "w-[400px]"
  isLoading?: boolean
}
```

**Auto-scroll Implementation**:
- Uses callback ref pattern
- Scrolls only once per popover open (`hasScrolledRef`)
- Smooth scroll behavior with `block: 'center'`
- Works with infinite scroll pagination

**Loading State**:
- Shows 8 skeleton items when `isLoading={true}`
- Skeleton matches actual item layout
- Pulse animation via Tailwind

### Skeleton Component

**Purpose**: Loading placeholder with shimmer effect

**Location**: `packages/frontend/shared-ui-components/src/lib/skeleton/skeleton.tsx`

**Usage**:
```tsx
<Skeleton className="h-4 w-3/4" />
```

## Generation Handling

The Team Builder is fully generation-aware:

**Stats**:
- Gen 1: HP, Attack, Defense, Speed, Special
- Gen 2+: HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed

**Implementation**:
- `getStats(generation)` returns available stat IDs
- `getStatName(statId, generation)` returns display name
- Stats that don't exist return names in brackets: "[Special Defense]"
- Filter out stats where `name.startsWith('[')`

**Moves**:
- Uses `usePokemonLearnset(speciesId, { generation })`
- Only shows moves learnable in that generation

**Items/Abilities**:
- `getItems(generation)` and `getAbility(ability, generation)` filter by generation

## Data Models

### PokemonInTeam

```typescript
interface PokemonInTeam extends PokemonSet {
  species: SpeciesName
  item: ItemName
  ability: AbilityName
  nature: NatureName
  gender: GenderName
  moves: MoveName[]  // Array of 4 moves (can be empty strings)
  level: number      // 1-100
  evs: {
    hp: number
    atk: number
    def: number
    spa: number
    spd: number
    spe: number
  }
  ivs: {
    hp: number
    atk: number
    def: number
    spa: number
    spd: number
    spe: number
  }
}
```

## TODO / Incomplete

### Missing Functionality

1. **Persistence**
   - Save button implemented with validation checks
   - Need to implement actual save to backend API
   - No local storage fallback
   - Teams lost on page refresh

2. **Gender Selection**
   - Not implemented in any tab
   - Should be in Basic tab
   - Need to filter by species.gender options

3. **Shiny Toggle**
   - Not implemented
   - Potential addition to Basic tab

4. **Tera Type** (Gen 9+)
   - Not implemented
   - Should be generation-conditional
   - Only show for Gen 9+

5. **Form Selection**
   - Some Pokemon have multiple forms (Rotom, Wormadam, etc.)
   - Not currently handled
   - May need to be in Pokemon selector or Basic tab

6. **Team Export/Import**
   - ✅ Pokemon can be removed from team
   - Need to implement Pokemon Showdown import/export
   - Need to implement team reordering (drag and drop)

7. **Format Rules/Clauses Display**
   - Format Rules Display currently only shows bans (Pokemon, moves, abilities, items)
   - Could be enhanced to show active format clauses with descriptions
   - Example clauses to display:
     - "Species Clause" - Cannot have duplicate Pokemon
     - "Sleep Clause Mod" - Cannot put more than one opponent to sleep
     - "Dynamax Clause" - Cannot Dynamax
     - "Team Preview" - See opponent's team before battle
   - Implementation would require re-adding helper functions:
     - `isRuleActive(formatId, rule)` - Check if a rule is active
     - `getRuleDescription(rule)` - Get human-readable description
     - `getFormatClauses(formatId)` - Get all clauses with descriptions
   - These functions were removed from `pokemon-showdown-validation` package but can be restored if needed
   - Would enhance user understanding of format rules beyond just knowing what's banned

### Known Issues

1. **EV Distribution Edge Cases**
   - When changing generation, EVs in non-existent stats remain
   - Should reset or redistribute EVs when generation changes

2. **Loading States**
   - Only Moves tab has loading state
   - Items/Natures could also benefit from loading indicators (though they're fast)

## Design Patterns

### Context Pattern
- Single source of truth for team state
- Exposes setter methods for controlled updates
- Uses callbacks for performance
- Team management methods:
  - `clearTeam()` - Reset all Pokemon slots
  - `hasAnyPokemon()` - Check if team has any Pokemon
  - `addActivePokemonToTeam(slot)` - Add current Pokemon to team

### Component Composition
- Tabs are independent components
- Shared SearchableSelect reduces duplication
- Each tab receives minimal props (just `pokemon` and/or `species`)

### Generation Safety
- All data fetching is generation-aware
- UI adapts to generation (stat list, move pool, etc.)
- Filters out non-existent options

### State Updates
- Individual updates use specific setters (setEV, setIV, etc.)
- Bulk updates use setValue (preset buttons)
- Validation happens in context layer

## Testing Considerations

### What to Test

1. **EV Distribution**
   - Cannot exceed 510 total
   - Cannot exceed 252 per stat
   - Properly caps values

2. **IV Range**
   - Cannot be negative
   - Cannot exceed 31
   - Preset buttons work correctly

3. **Generation Switching**
   - Stats list updates correctly
   - Move pool updates
   - No crashes on stat access

4. **Search & Filter**
   - Debounced search works
   - Results filtered correctly
   - Empty states handled

5. **Auto-scroll**
   - Scrolls to selected item
   - Only scrolls once
   - Doesn't break manual scrolling

## Future Enhancements

### Potential Features

1. **Import from Showdown**
   - Parse Pokemon Showdown export format
   - Auto-populate team

2. **Team Suggestions**
   - Suggest Pokemon based on team composition
   - Type coverage analysis
   - Role balance (offensive/defensive)

3. **Damage Calculator Integration**
   - Quick damage calcs from team builder
   - See how your Pokemon fare against common threats

4. **Sets Database**
   - Load popular competitive sets
   - Save custom sets
   - Share sets with community

5. **Sprite Preview**
   - Show Pokemon sprite
   - Show shiny variant
   - Animate on hover

6. **Advanced Validation**
   - Check tier legality
   - Validate moveset (no illegal move combos)
   - Check ability legality
   - Item clause checking (for formats that have it)

## Dependencies

### Packages Used

- `@pkmn/dex` - Pokemon data (moves, abilities, items, natures)
- `@pkmn/img` - Pokemon and item sprites
- `@pokehub/frontend/dex-data-provider` - Data fetching hooks
- `@pokehub/frontend/shared-ui-components` - UI components
- `@pokehub/frontend/shared-utils` - Type colors, utilities
- `@pokehub/frontend/pokemon-types` - Type definitions
- `lucide-react` - Icons

### Key Hooks

- `usePokemonLearnset` - Fetch Pokemon's learnset
- `usePokemonMovesFromLearnset` - Convert learnset to Move objects
- `useDebouncedSearch` - Debounced search input
- `useInfiniteScroll` - Paginated list rendering
- `useTeamEditorContext` - Access team state
- `useTeamChanges` - Track unsaved changes to team
- `useTiersStaticData` - Get available tiers for Singles/Doubles

## File Locations

```
packages/frontend/pokehub-team-builder/src/lib/
├── team-editor/
│   ├── team-editor.tsx
│   ├── team-configuration/
│   │   ├── team-configuration-section.tsx
│   │   ├── format-selector.tsx
│   │   ├── format-rules-display.tsx
│   │   └── team-validation-summary.tsx
│   ├── pokemon-card.tsx
│   ├── pokemon-editor/
│   │   ├── pokemon-editor.tsx
│   │   ├── basic-tab.tsx
│   │   ├── moves-tab.tsx
│   │   ├── evs-tab.tsx
│   │   ├── ivs-tab.tsx
│   │   └── searchable-select.tsx
│   ├── pokemon-selector/
│   │   └── pokemon-selector.tsx
│   └── team-analysis/
│       ├── team-analysis-dialog.tsx
│       ├── team-summary-tab.tsx
│       ├── defensive-coverage-tab.tsx
│       ├── offensive-coverage-tab.tsx
│       └── team-type-coverage.ts
├── context/
│   ├── team-editor-context/
│   │   ├── team-editor.context.tsx
│   │   ├── team-editor.provider.tsx
│   │   └── team-editor.context.model.ts
│   └── team-validation-context/
│       ├── team-validation.context.tsx
│       ├── team-validation.provider.tsx
│       └── team-validation-state.context.model.ts
└── hooks/
    ├── useTeamChanges.ts
    ├── useFormats.ts
    └── useFormatBans.ts

packages/frontend/pokemon-types/src/lib/
├── pokemon-team.ts
├── pokemon-team.validation.ts
└── index.ts

packages/frontend/shared-ui-components/src/lib/skeleton/
└── skeleton.tsx
```

## Changelog

### 2025-12-21 (Latest Updates)
- ✅ **Mobile Responsiveness: Pokemon Selector Optimization**
  - Added collapsible filter system for mobile screens
  - Filter toggle button appears on mobile (< lg breakpoint)
  - Type badges hidden by default, expand into horizontal scrollable row
  - Type tabs hidden on mobile to maximize Pokemon results space
  - Implemented horizontal ScrollArea with `ScrollBar orientation="horizontal"`
  - Flexible height system for results area (`min-h-0 flex-1`)
  - Desktop layout unchanged (full filter badges and tabs visible)

### 2025-11-28
- ✅ **Performance Optimizations**
  - Implemented lazy loading for dialog components (PokemonSelector, PokemonEditor, TeamAnalysisDialog)
  - Added lazy loading for validation components (FormatRulesDisplay, TeamValidationSummary)
  - Used webpack magic comments (`webpackPrefetch`, `webpackChunkName`) for intelligent prefetching
  - Added Suspense boundaries with skeleton loading states for graceful UX
  - **Tree Shaking**: Added `sideEffects: false` to `dex-data-provider/package.json`
  - Prevents `@pkmn/sim` dependencies from being included in routes that don't use them
  - Significant reduction in First Load JS for non-Team Builder routes
  - Better code splitting across the entire application
- ✅ **Added length bounds for Team Name and Pokemon Nicknames**
  - Team Name: Required, min 1 character, max 50 characters
  - Pokemon Nickname: Optional, max 12 characters (matching official Pokemon games Gen 6+)
  - Added `maxLength` attributes to Input components for better UX
  - Updated validation schemas in `pokemon-team.validation.ts`
- ✅ **Refactored Format Selection System**
  - Replaced separate format + tier dropdowns with unified FormatSelector
  - Uses searchable Combobox with grouped categories (Singles, Doubles, VGC, etc.)
  - Fetches formats dynamically from Pokemon Showdown API
  - Improved UX with search and collapsible categories
- ✅ **Updated Team Pokemon Structure**
  - Changed from fixed 6-slot array with undefined to dynamic array
  - Simplified Pokemon addition/removal logic
  - Better array management with filter and spread operators
- ✅ **Separated Validation Context**
  - Extracted validation logic into dedicated TeamValidationContext
  - Cleaner separation of concerns
  - Improved performance and type safety
- ✅ **Documented Team Analysis Feature**
  - Added comprehensive documentation for Team Analysis Dialog
  - Documented defensive and offensive coverage tabs
  - Included type coverage utilities
- ✅ **Documentation Sync**
  - Updated all documentation to reflect current implementation
  - Fixed outdated references to tier system
  - Corrected context usage examples

### 2025-11-23
- ✅ **Fixed validation error parsing for duplicate Pokemon**
  - Updated `parseValidationProblems` to only use explicit `(pokemon X)` slot markers from Showdown
  - Removed species name matching that incorrectly assigned errors with duplicate Pokemon (e.g., 2 Groudons)
  - Team-level errors now stay team-level unless Showdown explicitly marks them for a slot
  - Prevents confusion where first Pokemon gets all errors when duplicates exist
- ✅ **Improved validation UI clarity**
  - Renamed "Team Issues" → "Format Rule Violations" to clarify error source
  - Makes distinction clear between Showdown format rules and Zod configuration errors
  - Updated documentation to explain dual validation system architecture
- ✅ **Updated documentation**
  - Added comprehensive "Dual Validation System" section explaining Zod vs Showdown
  - Documented error assignment strategy and rationale
  - Updated validation UI examples with new labels
  - All 41 pokemon-showdown-validation tests passing

### 2025-11-23 (Initial Showdown Integration)
- ✅ Integrated Pokemon Showdown validation system
- ✅ Added format mapping utilities (PokeHub → Showdown format IDs)
- ✅ Implemented team validator with format-specific rules
- ✅ Created format rules retrieval system with ban lists
- ✅ Added Format Rules Display component showing banned Pokemon/moves/abilities/items
- ✅ Implemented proactive filtering in Pokemon Selector, Moves Tab, and Basic Tab
- ✅ Enhanced validation UI with success states and collapsible error display
- ✅ Added error count badges and improved visual hierarchy
- ✅ Implemented lazy loading for validation components (FormatRulesDisplay, TeamValidationSummary)
- ✅ Created loading fallbacks with meaningful messages
- ✅ Added Suspense boundaries for better performance
- ✅ Refactored to single source of truth for validation in context
- ✅ Removed duplicate validation computation from components
- ✅ Updated types from ValidationResult to TeamValidationState
- ✅ Created useFormatBans hook for fetching format restrictions
- ✅ Updated UI architecture from 6 slots to one-at-a-time Pokemon addition
- ✅ All 212 tests passing with updated mocks

### 2025-11-16
- ✅ Implemented Cancel functionality with smart change detection
- ✅ Added Pokemon snapshot state for restoring on cancel
- ✅ Exported `arePokemonEqual` from `useTeamChanges` for reuse
- ✅ Added confirmation dialog for unsaved changes
- ✅ Implemented consistent behavior for Cancel button and X button
- ✅ Added deep copy logic for Pokemon snapshot

### 2025-11-14
- ✅ Implemented comprehensive team validation system with Zod schemas
- ✅ Added change tracking hook for detecting unsaved changes
- ✅ Created validation summary component with error grouping
- ✅ Added visual error indicators to Pokemon cards (border, icon, tooltip)
- ✅ Implemented duplicate move prevention in Moves tab
- ✅ Added inline validation to Moves tab (requires at least one move)
- ✅ Enhanced Save button with validation + change tracking
- ✅ Added generation lock with confirmation dialog
- ✅ Implemented team clearing on generation change
- ✅ Added toast notifications for user feedback

### 2025-11-14
- ✅ Created Basic Tab with ability, item, nature selection
- ✅ Implemented SearchableSelect shared component
- ✅ Added auto-scroll to selected item feature
- ✅ Fixed alignment issues between selects
- ✅ Created Moves Tab with searchable move selection
- ✅ Added loading states with Skeleton component
- ✅ Implemented type badges with proper colors
- ✅ Created EVs Tab with validation
- ✅ Created IVs Tab with preset buttons
- ✅ Added generation-aware stat filtering
- ✅ Fixed Max All/Trick Room buttons to update atomically
