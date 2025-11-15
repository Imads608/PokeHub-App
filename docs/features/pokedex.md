# Pokédex Feature Documentation

## Overview

The Pokédex is the core feature of PokeHub, providing a comprehensive Pokemon database browser with search, filtering, and detailed Pokemon information. Users can explore all Pokemon across different generations, view stats, abilities, evolution chains, and movesets.

**Status**: Complete and Production-Ready

## User Flow

```
Landing Page → Pokédex Browse → Pokemon Details
                                     ↓
                            (Stats / Evolution / Moves Tabs)
```

## Architecture

### Routes

- **Browse Route**: `/pokedex` - Main Pokemon listing with search and filters
- **Details Route**: `/pokedex/[id]` - Individual Pokemon details page

### Component Structure

```
pokehub-dex-components/
├── search/
│   ├── dex-search.tsx                  # Main search container
│   ├── filters/
│   │   ├── desktop-filter-contents.tsx # Desktop filter panel
│   │   ├── mobile-filter.tsx           # Mobile filter drawer
│   │   └── search-bar.tsx              # Search input
│   └── results/
│       ├── search-results.tsx          # Pokemon grid display
│       └── pokemon-card.tsx            # Individual Pokemon card
├── pokemon/
│   ├── pokemon-details.tsx             # Pokemon detail view container
│   ├── pokemon-header.tsx              # Pokemon header with image/name
│   └── tabs/
│       ├── stats/
│       │   ├── stats-tab.tsx           # Base stats and abilities
│       │   ├── type-effectiveness-card.tsx
│       │   └── ability-card.tsx
│       ├── evo/
│       │   └── evo-tab.tsx            # Evolution chain visualization
│       └── moves/
│           ├── moves-tab.tsx           # Move table
│           ├── moves-table.tsx
│           ├── moves-table-content.tsx
│           └── moves-table-toolbar.tsx
```

## Features

### 1. Pokemon Search & Browse

**Location**: `/pokedex`

**Search Capabilities**:
- **Text Search**: Search by Pokemon name (debounced)
- **Type Filtering**: Single or dual-type filtering
- **Generation Filtering**: Filter by game generation (1-9)
- **Tier Filtering**: Competitive tier filters (OU, UU, RU, etc.)
- **Real-time Results**: Instant updates as filters change

**Display Options**:
- **Grid View**: Pokemon displayed as cards with sprites
- **Infinite Scroll**: Lazy loading for performance
- **Generation Icons**: Visual indicators for Pokemon generation
- **Type Badges**: Color-coded type indicators

**Technical Implementation**:
- Uses TanStack Query for data fetching and caching
- Debounced search (reduces API calls)
- Filter state managed via URL search params
- Responsive grid layout (mobile/tablet/desktop)

**Key Components**:
```tsx
// Main search container
<DexSearchContainer
  generation={generation}
  format={format}
  onPokemonSelect={(pokemon) => router.push(`/pokedex/${pokemon.id}`)}
/>
```

**Data Sources**:
- `@pkmn/dex` - Primary Pokemon data source
- `useGetPokemonByCompetiveFilter` - Filters Pokemon by tier/generation
- PokeAPI - Supplementary data (sprites, species info)

### 2. Pokemon Details Page

**Location**: `/pokedex/[id]`

**Overview Display**:
- Pokemon sprite (with shiny toggle capability)
- Pokemon name and national dex number
- Types with badges
- Generation indicator
- Height and weight
- Abilities (regular and hidden)
- Form selector (for Pokemon with multiple forms)

**Tab System**:

#### Stats Tab
**Features**:
- **Base Stats Chart**: Visual bar chart of HP, Attack, Defense, Sp. Atk, Sp. Def, Speed
- **Base Stat Total (BST)**: Calculated total
- **Abilities Section**:
  - Regular abilities
  - Hidden ability (if available)
  - Ability descriptions
- **Type Effectiveness Chart**:
  - 4x weaknesses
  - 2x weaknesses
  - 0.5x resistances
  - 0.25x resistances
  - Immunities (0x)
  - Generation-aware type matchups

**Technical Details**:
- Uses `usePokemonDetails` hook to fetch Pokemon data
- `usePokemonTypesEffectiveness` calculates type matchups
- Generation-specific type effectiveness (e.g., Steel vs Ghost differs by gen)
- Visual color coding:
  - Red: Super effective (4x, 2x)
  - Green: Resistant (0.5x, 0.25x)
  - Gray: Immune (0x)

#### Evolution Tab
**Features**:
- **Evolution Chain Visualization**: Tree-style evolution display
- **Evolution Methods**: Shows level, item, trade, or special conditions
- **Form Variants**: Regional forms, Mega evolutions, etc.
- **Clickable Evolution Nodes**: Navigate to evolved Pokemon

**Technical Details**:
- Uses `usePokemonSpeciesPokeAPIDetails` for evolution data
- Parses PokeAPI evolution chain structure
- Handles complex evolution trees (Eevee, Wurmple, etc.)
- Generation-aware evolution methods

#### Moves Tab
**Features**:
- **Comprehensive Move Table**:
  - Move name
  - Type
  - Category (Physical/Special/Status)
  - Base Power
  - Accuracy
  - PP (Power Points)
  - Learn method (Level-up, TM, Egg, Tutor)
  - Level learned (for level-up moves)
  - Move description
- **Filtering & Sorting**:
  - Filter by learn method
  - Filter by type
  - Filter by category
  - Sort by level, name, power, accuracy
  - Search by move name
- **Pagination**: Paginated table for large movesets
- **Generation Support**: Shows moves available in selected generation

**Technical Details**:
- Uses `usePokemonMovesFromLearnset` hook
- TanStack Table for advanced table features (sorting, filtering, pagination)
- Move data from Pokemon Showdown
- Color-coded type badges
- Responsive table (stacks on mobile)

**Toolbar Features**:
- Learn method filter dropdown
- Type filter
- Category filter
- Search input
- Clear all filters button

### 3. Form Selection

**Feature**: Pokemon with multiple forms (Rotom, Wormadam, Alolan variants, etc.)

**Capabilities**:
- Dropdown to select form variant
- Stats update based on form
- Sprite changes
- Type changes (e.g., Rotom forms)
- Moveset differences

**Technical Implementation**:
- Detects forms via `species.otherFormes` or `species.cosmeticFormes`
- Updates entire details view when form changes
- Maintains URL state for sharing

### 4. Generation Selection

**Feature**: View historical Pokemon data from different generations

**How It Works**:
- Generation selector in header/filters
- All data fetches respect selected generation
  - Moves available in that gen
  - Type effectiveness for that gen
  - Abilities available in that gen
  - Evolution methods for that gen
- Historical data accuracy (e.g., no Dark type in Gen 1)

**Technical Implementation**:
```tsx
const { data: pokemon } = usePokemonDetails(pokemonId, {
  generation: selectedGeneration
});
```

## Data Flow

### Search Flow
```
User Input (Search/Filters)
    ↓
URL Search Params Updated
    ↓
Query Hook Triggered
    ↓
Filter Pokemon via @pkmn/dex
    ↓
Results Rendered in Grid
```

### Details Flow
```
Pokemon Selected
    ↓
Navigate to /pokedex/[id]
    ↓
Parallel Data Fetches:
  - usePokemonDetails (base data)
  - usePokemonPokeAPIDetails (sprites, species)
  - usePokemonLearnset (moves)
  - usePokemonTypesEffectiveness (type chart)
    ↓
Data Combined & Rendered
    ↓
User Navigates Tabs
```

## Data Sources & Hooks

### Primary Hooks

| Hook | Purpose | Data Source |
|------|---------|-------------|
| `usePokemonDetails` | Core Pokemon data | @pkmn/dex |
| `usePokemonPokeAPIDetails` | Sprites, images | PokeAPI |
| `usePokemonLearnset` | Move learning data | @pkmn/dex |
| `usePokemonMovesFromLearnset` | Full move details | @pkmn/dex |
| `usePokemonTypesEffectiveness` | Type matchup chart | @pkmn/dex |
| `useGetPokemonByCompetiveFilter` | Filter by tier/gen | @pkmn/dex |
| `usePokemonSpeciesPokeAPIDetails` | Evolution chains | PokeAPI |

### Data Providers

1. **@pkmn/dex**: Comprehensive Pokemon game data
   - All Pokemon stats, abilities, moves
   - Generation-specific data
   - Competitive tier information
   - Type effectiveness calculations

2. **PokeAPI** (via pokeapi-js-wrapper): Supplementary data
   - High-quality sprites
   - Evolution chains
   - Species flavor text
   - Form variations

3. **@pkmn/img**: Pokemon and item sprites
   - Official artwork
   - Generation-specific sprites
   - Item icons

## Responsive Design

### Desktop (1024px+)
- Filter panel on left side
- Pokemon grid: 4-5 columns
- Full table layout for moves
- Expanded type effectiveness chart

### Tablet (768px - 1023px)
- Collapsible filter panel
- Pokemon grid: 3 columns
- Scrollable move table

### Mobile (< 768px)
- Filter drawer (slides up from bottom)
- Pokemon grid: 2 columns
- Stacked card layout for stats
- Simplified move table (essential columns only)
- Bottom navigation

## Performance Optimizations

### Search & Browse Page
1. **Debounced Search**: 300ms delay to reduce API calls
2. **Infinite Scroll**: Load ~50 Pokemon at a time
3. **Image Lazy Loading**: Sprites load as user scrolls
4. **TanStack Query Caching**: Cache search results for 5 minutes
5. **URL State**: Filters persist via search params (shareable URLs)

### Details Page
1. **Parallel Data Fetching**: All hooks run concurrently
2. **Stale-While-Revalidate**: Show cached data while fetching fresh data
3. **Tab Lazy Loading**: Only render active tab content
4. **Memoized Calculations**: Type effectiveness cached
5. **Image Preloading**: Load sprite while loading other data

## Accessibility

- **Keyboard Navigation**: Full keyboard support for filters and navigation
- **ARIA Labels**: All interactive elements properly labeled
- **Focus Management**: Proper focus states and tab order
- **Screen Reader Support**: Semantic HTML and ARIA attributes
- **Color Contrast**: WCAG AA compliant colors
- **Alt Text**: All images have descriptive alt text

## Styling & Theming

### Type Colors
Consistent color scheme for all 18 Pokemon types:
- Normal: Gray
- Fire: Orange/Red
- Water: Blue
- Electric: Yellow
- Grass: Green
- Ice: Light Blue
- Fighting: Dark Red
- Poison: Purple
- Ground: Brown/Tan
- Flying: Light Purple
- Psychic: Pink
- Bug: Lime Green
- Rock: Brown
- Ghost: Purple
- Dragon: Indigo
- Dark: Dark Gray
- Steel: Steel Gray
- Fairy: Pink

### Dark/Light Mode
- Automatic theme detection
- Toggle in navigation
- Persistent user preference
- All components theme-aware

## Error Handling

### Not Found (404)
- Pokemon ID doesn't exist
- Show user-friendly message
- Link back to Pokédex

### Loading States
- Skeleton loaders for Pokemon cards
- Loading spinners for tabs
- Progressive loading (show available data first)

### Error States
- API failures gracefully handled
- Retry buttons where appropriate
- Fallback to cached data when possible

## Known Limitations

1. **Form Coverage**: Some obscure forms may not be fully supported
2. **Historical Accuracy**: Very early generation data (Gen 1-2) may have minor gaps
3. **Move Descriptions**: Some move descriptions truncated for older moves
4. **Sprite Quality**: Varies by generation (older gens have lower resolution)

## Future Enhancements

### Planned Features

1. **Comparison Mode**: Compare 2-3 Pokemon side-by-side
2. **Team Coverage Analysis**: See type coverage for a team
3. **Advanced Filters**:
   - Filter by ability
   - Filter by base stat range
   - Filter by move
   - Filter by egg group
4. **Favorites/Bookmarks**: Save favorite Pokemon to profile
5. **Share Pokemon**: Generate shareable cards/images
6. **Breeding Info**: Egg groups, breeding chains
7. **Damage Calculator**: Quick damage calculations
8. **Pokémon Cries**: Play Pokemon cries/sounds
9. **Animated Sprites**: Support for animated GIFs
10. **Regional Dex Filters**: Filter by regional Pokédex

### Potential Improvements

- **Search Autocomplete**: Suggest Pokemon as user types
- **Recent Searches**: Show recently viewed Pokemon
- **Smart Suggestions**: "People also viewed..." based on types/stats
- **Export Data**: Download Pokemon stats as CSV/JSON
- **Print Friendly**: Printer-friendly Pokemon details page

## Testing Checklist

### Critical Paths
- [ ] Search by name returns correct results
- [ ] Type filters work correctly (single and dual type)
- [ ] Generation filter shows correct Pokemon
- [ ] Pokemon details page loads with correct data
- [ ] Stats tab shows accurate base stats
- [ ] Type effectiveness matches generation rules
- [ ] Evolution tab displays correct evolution chain
- [ ] Moves tab filters work (method, type, category)
- [ ] Form selector updates stats and sprite
- [ ] Generation selector updates all data appropriately

### Edge Cases
- [ ] Pokemon with no evolutions (Lapras, Aerodactyl)
- [ ] Pokemon with complex evolution (Eevee, Wurmple, Tyrogue)
- [ ] Pokemon with many forms (Alcremie, Vivillon)
- [ ] Pokemon with type changes on evolution
- [ ] Pokemon unavailable in certain generations
- [ ] Moves with perfect accuracy (show "—" not "100%")
- [ ] Status moves (no base power shown)

## Dependencies

### NPM Packages
- `@pkmn/dex` - Pokemon game data
- `@pkmn/img` - Pokemon sprites
- `pokeapi-js-wrapper` - PokeAPI client
- `@tanstack/react-query` - Data fetching and caching
- `@tanstack/react-table` - Advanced table features
- `next` - Next.js framework
- `react` - React library

### Internal Packages
- `@pokehub/frontend/dex-data-provider` - Pokemon data hooks
- `@pokehub/frontend/pokehub-dex-components` - Dex UI components
- `@pokehub/frontend/pokehub-ui-components` - Shared UI components
- `@pokehub/frontend/shared-ui-components` - Design system
- `@pokehub/frontend/shared-utils` - Utility functions
- `@pokehub/frontend/pokemon-static-data` - Static generation data

## File Locations

```
apps/pokehub-app/app/
├── pokedex/
│   ├── page.tsx                    # Browse page
│   └── [id]/
│       └── page.tsx                # Details page

packages/frontend/pokehub-dex-components/src/lib/
├── search/
│   ├── dex-search.tsx
│   ├── filters/
│   │   ├── desktop-filter-contents.tsx
│   │   ├── mobile-filter.tsx
│   │   └── search-bar.tsx
│   └── results/
│       ├── search-results.tsx
│       └── pokemon-card.tsx
└── pokemon/
    ├── pokemon-details.tsx
    ├── pokemon-header.tsx
    └── tabs/
        ├── stats/
        │   ├── stats-tab.tsx
        │   ├── type-effectiveness-card.tsx
        │   └── ability-card.tsx
        ├── evo/
        │   └── evo-tab.tsx
        └── moves/
            ├── moves-tab.tsx
            ├── moves-table.tsx
            ├── moves-table-content.tsx
            └── moves-table-toolbar.tsx

packages/frontend/dex-data-provider/src/lib/
├── hooks/
│   ├── pokemon-details.hook.ts
│   ├── pokemon-learnset.hook.ts
│   ├── pokemon-moves-from-learnset.hook.ts
│   ├── pokemon-pokeapi-details.hook.ts
│   ├── pokemon-types-effectiveness.hook.ts
│   └── pokemon-competitive.hook.ts
└── api/
    └── pokemon-dex.api.ts
```

## Changelog

### Initial Release
- ✅ Pokemon search and browse functionality
- ✅ Advanced filtering (type, generation, tier)
- ✅ Pokemon details page with tabs
- ✅ Stats visualization
- ✅ Type effectiveness chart
- ✅ Evolution chain display
- ✅ Comprehensive move table
- ✅ Form variant support
- ✅ Generation-aware data
- ✅ Responsive design
- ✅ Dark/light theme support
