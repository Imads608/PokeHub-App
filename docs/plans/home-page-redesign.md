# Home Page Redesign Plan

## Overview

Transform the minimal home page into an engaging marketing landing page that showcases PokeHub's features and entices users to explore. The page will remain **fully static** (no API calls) while displaying featured Pokemon.

## Current State

The current home page (`apps/pokehub-app/app/page.tsx`) is minimal:

- Single hero section with red→blue gradient background
- CSS-only Pokeball illustration (no actual Pokemon imagery)
- Two CTA buttons (one broken - "Explore Pokedex" has no link)
- No additional sections, features showcase, or footer

## Goals

- Create an appealing marketing-style landing page
- Showcase main features (Pokedex, Team Builder, Battle)
- Display popular Pokemon to attract users
- Keep the page fully static (no data fetching)
- Maintain the red→blue brand gradient
- Create a new modern logo

## Files to Create/Modify

| File                                                                | Action      | Purpose                            |
| ------------------------------------------------------------------- | ----------- | ---------------------------------- |
| `packages/frontend/pokemon-static-data/src/lib/featured-pokemon.ts` | **Create**  | Static data for 6 featured Pokemon |
| `packages/frontend/pokemon-static-data/src/index.ts`                | **Modify**  | Export featured Pokemon data       |
| `apps/pokehub-app/public/images/logo.svg`                           | **Replace** | New modern PokeHub logo            |
| `apps/pokehub-app/app/page.tsx`                                     | **Modify**  | Complete home page redesign        |

## Implementation Details

### 1. Featured Pokemon Static Data

Create a hardcoded list of 6 popular/iconic Pokemon:

```typescript
export interface FeaturedPokemon {
  id: string;
  name: string;
  num: number;
  types: string[];
  artwork: string; // Static PokeAPI URL
}

export const FEATURED_POKEMON: FeaturedPokemon[] = [
  {
    id: 'pikachu',
    name: 'Pikachu',
    num: 25,
    types: ['Electric'],
    artwork: '...',
  },
  {
    id: 'charizard',
    name: 'Charizard',
    num: 6,
    types: ['Fire', 'Flying'],
    artwork: '...',
  },
  {
    id: 'mewtwo',
    name: 'Mewtwo',
    num: 150,
    types: ['Psychic'],
    artwork: '...',
  },
  {
    id: 'gengar',
    name: 'Gengar',
    num: 94,
    types: ['Ghost', 'Poison'],
    artwork: '...',
  },
  {
    id: 'garchomp',
    name: 'Garchomp',
    num: 445,
    types: ['Dragon', 'Ground'],
    artwork: '...',
  },
  {
    id: 'lucario',
    name: 'Lucario',
    num: 448,
    types: ['Fighting', 'Steel'],
    artwork: '...',
  },
];
```

Sprite URL pattern (static, no API needed):

```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{dexNumber}.png
```

### 2. New Modern Logo

**Design concept:**

- Left: Stylized half-Pokeball icon (red top arc, white bottom, center line)
- Right: "PokeHub" text in clean sans-serif
- Colors: Red (#d62828) and blue (#0066ff) accent
- Compact, works at small sizes (nav) and larger sizes

### 3. Home Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      HERO SECTION                           │
│  "Begin Your Pokemon Journey"                               │
│  Subtitle + [Explore Pokedex] [Sign Up] buttons             │
│  Right side: 3 overlapping Pokemon artworks                 │
│  Background: Red→Blue gradient (existing)                   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    STATS BANNER                             │
│     1000+ Pokemon  •  800+ Moves  •  100+ Abilities         │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  FEATURES SECTION                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Pokedex      │ │ Team Builder │ │ Battle       │        │
│  │ Browse all   │ │ Create your  │ │ Test your    │        │
│  │ Pokemon...   │ │ dream team   │ │ skills...    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│              FEATURED POKEMON SECTION                       │
│         "Discover Popular Pokemon"                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │Pika  │ │Chari │ │Mewtwo│ │Gengar│ │Garcho│ │Lucar │    │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
│                    [Explore All →]                          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                       FOOTER                                │
│     Pokedex  •  Team Builder  •  Battle  •  GitHub          │
│              Built for Pokemon fans                         │
└─────────────────────────────────────────────────────────────┘
```

### 4. Components & Imports

Using existing components:

- `Button`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` from `@pokehub/frontend/shared-ui-components`
- `PokemonTypeBadge` from `@pokehub/frontend/pokehub-ui-components`
- `BookOpen`, `Users`, `Swords`, `ChevronRight`, `UserPlus`, `Github` from `lucide-react`
- `Link` and `Image` from Next.js

### 5. Styling Approach

| Element       | Styling                                                   |
| ------------- | --------------------------------------------------------- |
| Hero gradient | Keep `from-primary/90 to-secondary/90` (red→blue)         |
| Stats banner  | `glass` utility class (semi-transparent, backdrop blur)   |
| Feature cards | White/card background with subtle shadow, rounded corners |
| Pokemon cards | Hover scale effect, type-colored border accent            |
| Footer        | Dark/muted background, contrasting with main content      |

## Bug Fixes Included

- **Broken "Explore Pokedex" button** - Wrap with `<Link href="/pokedex">`

## Success Criteria

- [ ] Logo displays correctly in nav at various sizes
- [ ] Hero section shows Pokemon artwork
- [ ] All CTA buttons link to correct pages
- [ ] Feature cards link to respective pages
- [ ] Pokemon cards display with type badges
- [ ] Page is fully static (no API calls on load)
- [ ] Responsive design works on mobile/tablet/desktop
