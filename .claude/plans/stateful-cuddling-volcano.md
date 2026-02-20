# Phase 5.7: Battlefield Background System

## Context

The current battle arena is a flat gradient (`bg-gradient-to-b from-muted/20 via-transparent to-muted/20`). It feels empty compared to Showdown's battlefield which has a visual arena with ground, sky, and environmental effects. We want a proper battlefield background that:

- Shows a default arena/field scene (AI-generated image)
- Will support dynamic weather/terrain background swaps later (architecture ready, just one default image for now)
- Maintains the existing Pokemon sprite positioning and UI overlays

## Approach

### 1. Generate & Add Default Battlefield Image

Create/source an AI-generated battlefield background image and place it at:
```
apps/pokehub-app/public/images/backgrounds/default-field.webp
```

The image should be a wide Pokemon-style arena scene — open field, subtle sky, grassy ground — suitable as a generic battle backdrop. Target ~1920x800 resolution, compressed webp.

**For now:** Use a CSS gradient fallback that looks like a proper arena (green ground fading to blue sky). The user can later replace with an AI-generated image. This keeps the PR self-contained without needing external image generation.

### 2. Battlefield Background Component

**New file:** `.../battlefield/battlefield-bg.tsx`

A component that renders the arena background behind the Pokemon sprites. Accepts weather/terrain to apply tinted overlays.

```tsx
interface BattlefieldBgProps {
  weather?: WeatherName | null;
  terrain?: TerrainName | null;
}
```

**Layers (bottom to top):**
1. **Base image/gradient** — the arena scene (`background-image` or CSS gradient fallback)
2. **Weather overlay** — semi-transparent colored div that tints the scene (e.g., blue for rain, orange for sun)
3. **Terrain overlay** — bottom-half gradient for terrain effects (e.g., green glow for Grassy Terrain)

Weather tint map (reuses colors from existing `weatherConfig` in `field-effects.tsx`):
- Sun: warm orange/yellow tint
- Rain: cool blue tint
- Sand: amber/brown tint
- Hail/Snow: icy blue-white tint
- Harsh Sunshine: deep red-orange
- Heavy Rain: dark blue
- Strong Winds: teal

Terrain overlay map:
- Electric: yellow glow from bottom
- Grassy: green glow from bottom
- Psychic: pink/purple glow from bottom
- Misty: white/pink fog from bottom

### 3. Update Battle Container Layout

**File:** `.../battlefield/battle-container.tsx` (line 64)

Replace the current arena div's gradient with `BattlefieldBg` as an absolutely-positioned background layer:

```tsx
<div className="relative rounded-2xl border border-border/30 overflow-hidden p-8 min-h-[400px] flex flex-col justify-between">
  {/* Background layer */}
  <BattlefieldBg weather={battle.field.weather} terrain={battle.field.terrain} />

  {/* Existing content (Pokemon, field effects, overlays) — all relative, on top */}
  ...
</div>
```

Key changes:
- Remove `bg-gradient-to-b from-muted/20 via-transparent to-muted/20` from the arena div
- Add `overflow-hidden` to clip the background within rounded corners
- `BattlefieldBg` is `absolute inset-0` so it fills behind everything
- All existing children stay `relative` or positioned above

### 4. CSS Gradient Fallback (Default Arena)

Until AI-generated images are ready, the default background uses a CSS gradient that suggests a battle arena:

```css
/* Sky to ground gradient */
background: linear-gradient(
  to bottom,
  #1a2a4a 0%,       /* dark sky */
  #2d4a6a 30%,      /* lighter sky */
  #4a7a5a 55%,      /* treeline/horizon */
  #3d6b3d 65%,      /* grass */
  #2d5a2d 100%      /* darker ground */
);
```

This creates a natural-looking arena backdrop that works well in both light and dark themes when dimmed with an opacity overlay.

## Files to Create

| File | Description |
|------|-------------|
| `.../battlefield/battlefield-bg.tsx` | Background component with weather/terrain overlays |

## Files to Modify

| File | Change |
|------|--------|
| `.../battlefield/battle-container.tsx` | Replace arena gradient with `BattlefieldBg`, add `overflow-hidden` |

## Architecture Notes

- Background images (when added later) go in `public/images/backgrounds/` named by condition: `default-field.webp`, `rain.webp`, `sun.webp`, etc.
- The component checks for the image file and falls back to the CSS gradient if not found
- Weather/terrain overlays are always CSS — they tint on top of whatever base is used
- Transition between backgrounds uses CSS `transition-opacity` for smooth crossfade

## Verification

```bash
nx build pokehub-app

# Manual:
# 1. Open battle → arena has a sky-to-ground gradient background instead of flat muted gradient
# 2. Pokemon sprites render on top with their shadows visible
# 3. Field effect badges still display correctly in the center
# 4. Disconnect overlay and battle end overlay still render on top
# 5. (Future) Weather changes tint the arena — rain adds blue overlay, sun adds warm overlay
```
