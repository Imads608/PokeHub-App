# Team Builder Feature Documentation

## Overview

The Team Builder feature allows users to create and customize competitive Pokemon teams. It provides an intuitive interface for configuring Pokemon stats, moves, abilities, items, and other battle-relevant attributes.

**Status**: In Development (Core editing complete, validation implemented, persistence pending)

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
- Team metadata (name, format, tier, generation)
- Active Pokemon being edited
- Pokemon in team (6 slots)

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
- **Nickname**: Text input (defaults to species name)
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

## Validation & Change Tracking ✅

### Team Validation System

**Purpose**: Ensure teams meet format requirements before saving

**Implementation**:
- **Zod Schemas** (`pokemon-team.validation.ts`):
  - `pokemonInTeamSchema` - Validates individual Pokemon
  - `pokemonTeamSchema` - Validates entire team

**Validation Rules**:
- **Required Fields**: Species, ability must be non-empty
- **Moves**: At least 1 move required (max 4)
- **EVs**: Total cannot exceed 510, max 252 per stat
- **IVs**: Must be 0-31 range
- **Team Name**: Optional but recommended

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

1. **Save/Cancel Actions**
   - Save button currently logs to console
   - Cancel button currently logs to console
   - Need to implement actual save to team array
   - Need to handle dialog close

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

6. **Team Management**
   - No way to remove Pokemon from team
   - No way to reorder Pokemon
   - No team export/import

7. **Persistence**
   - No saving to backend
   - No local storage
   - Teams lost on page refresh

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
│   ├── team-configuration-section.tsx
│   ├── team-validation-summary.tsx
│   ├── pokemon-card.tsx
│   ├── pokemon-editor/
│   │   ├── pokemon-editor.tsx
│   │   ├── basic-tab.tsx
│   │   ├── moves-tab.tsx
│   │   ├── evs-tab.tsx
│   │   ├── ivs-tab.tsx
│   │   └── searchable-select.tsx
│   ├── context/
│   │   └── team-editor.context.tsx
│   └── hooks/
│       ├── useTeamChanges.ts
│       └── useTiersStaticData.tsx
└── ...

packages/frontend/pokemon-types/src/lib/
├── pokemon-team.ts
├── pokemon-team.validation.ts
└── index.ts

packages/frontend/shared-ui-components/src/lib/skeleton/
└── skeleton.tsx
```

## Changelog

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

### 2025-01-14
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
