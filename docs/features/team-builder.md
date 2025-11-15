# Team Builder Feature Documentation

## Overview

The Team Builder feature allows users to create and customize competitive Pokemon teams. It provides an intuitive interface for configuring Pokemon stats, moves, abilities, items, and other battle-relevant attributes.

**Status**: In Development (Tabs 1-4 of 4 completed)

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

6. **Validation**
   - No validation that Pokemon has at least 1 move
   - No validation that required fields are filled
   - No error states

7. **Team Management**
   - No way to remove Pokemon from team
   - No way to reorder Pokemon
   - No team export/import
   - No team name editing UI

8. **Persistence**
   - No saving to backend
   - No local storage
   - Teams lost on page refresh

### Known Issues

1. **EV Distribution Edge Cases**
   - When changing generation, EVs in non-existent stats remain
   - Should reset or redistribute EVs when generation changes

2. **Move Slots**
   - Empty move slots show as empty strings
   - Should have better empty state UI

3. **Loading States**
   - Only Moves tab has loading state
   - Items/Natures could also benefit from loading indicators (though they're fast)

## Design Patterns

### Context Pattern
- Single source of truth for team state
- Exposes setter methods for controlled updates
- Uses callbacks for performance

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

6. **Team Validation**
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

## File Locations

```
packages/frontend/pokehub-team-builder/src/lib/
├── team-editor/
│   ├── team-editor.tsx
│   ├── pokemon-editor/
│   │   ├── pokemon-editor.tsx
│   │   ├── basic-tab.tsx
│   │   ├── moves-tab.tsx
│   │   ├── evs-tab.tsx
│   │   ├── ivs-tab.tsx
│   │   └── searchable-select.tsx
│   └── context/
│       └── team-editor.context.tsx
└── ...

packages/frontend/shared-ui-components/src/lib/skeleton/
└── skeleton.tsx
```

## Changelog

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
