# Battle Animation System

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Animation Event Flow](#animation-event-flow)
  - [Key Abstractions](#key-abstractions)
- [AnimationEvent Types](#animationevent-types)
  - [Event Extraction](#event-extraction)
- [AnimationScene — The Rendering Interface](#animationscene--the-rendering-interface)
  - [SpriteHandle](#spritehandle)
  - [EffectSpriteConfig](#effectspriteconfig)
  - [PopupConfig](#popupconfig)
- [State Transition Animations](#state-transition-animations)
  - [Damage](#damage)
  - [Heal](#heal)
  - [Faint](#faint)
  - [Switch In / Switch Out](#switch-in--switch-out)
  - [Boost / Unboost](#boost--unboost)
  - [Status](#status)
  - [Effectiveness (Super Effective, Crit, Miss)](#effectiveness-super-effective-crit-miss)
  - [Weather and Terrain](#weather-and-terrain)
- [Move Animations](#move-animations)
  - [Move Animation Registry](#move-animation-registry)
  - [Server-Delivered Move Configs](#server-delivered-move-configs)
  - [Template-Based Animation System](#template-based-animation-system)
  - [Lazy Loading](#lazy-loading)
  - [Generic Fallbacks](#generic-fallbacks)
  - [Hand-Written Move Animations](#hand-written-move-animations)
- [Easing and Duration Constants](#easing-and-duration-constants)
- [Visual Layers](#visual-layers)
  - [EffectLayer (Projectile Sprites)](#effectlayer-projectile-sprites)
  - [PopupLayer (Damage Numbers)](#popuplayer-damage-numbers)
  - [Flash Overlay](#flash-overlay)
  - [Screen Shake](#screen-shake)
- [PokemonSprite — Animation Target](#pokemonsprite--animation-target)
- [Adding a New Move Animation](#adding-a-new-move-animation)
  - [Step 1: Create the Animation File](#step-1-create-the-animation-file)
  - [Step 2: Register It](#step-2-register-it)
  - [Animation Patterns](#animation-patterns)
- [Effect Sprite CDN](#effect-sprite-cdn)
- [Related Documentation](#related-documentation)

---

## Overview

The animation system brings battles to life with move animations, damage effects, faints, switches, stat changes, and screen effects. It uses the Motion library (`motion/react`) for smooth CSS-based animations and Showdown's effect sprite CDN for visual assets.

Animations are tightly integrated with the protocol processing pipeline: animation events are extracted **before** battle state mutates, played in sequence, and the UI updates after each state-changing event. This ensures the user sees damage after the move animation plays, HP drops smoothly, and faints happen at the right moment.

The system uses deliberate timing to keep the player informed: log entries for action-starters (moves, switches) appear **before** the animation with a readable pause, while consequence logs (damage numbers, status messages) appear **after** the corresponding state change (e.g., HP bar drop). The action panel is hidden during turn processing via `turnProcessing` and only reappears once all events and animations are complete.

## Architecture

### Animation Event Flow

```
  Server protocol text
        │
        ▼
  ┌──────────────────────────────────────────────────────────┐
  │  BATTLE_UPDATE dispatch wrapper                          │
  │                                                          │
  │  Protocol.parse(text)                                    │
  │        │                                                 │
  │        ▼                                                 │
  │  For each { args, kwArgs }:                              │
  │    ┌──────────────────────────────────────────┐          │
  │    │  extractAnimationEvent(args, battle)      │          │
  │    │  ─── reads current battle state           │          │
  │    │  ─── e.g. prevHp = pokemon.hp             │          │
  │    │  ─── returns AnimationEvent | null        │          │
  │    └──────────────────────────────────────────┘          │
  │        │                                                 │
  │        ▼                                                 │
  │  PendingProtocolEvent { args, kwArgs, animEvent }        │
  │  ─── pushed to pendingEventsRef queue                    │
  └──────────────────────────────────────────────────────────┘
        │
        ▼
  ┌──────────────────────────────────────────────────────────┐
  │  processPendingEvents(playAnimation)                     │
  │                                                          │
  │  All intermediate dispatches set turnProcessing: true    │
  │  (hides action panel during turn playback)               │
  │                                                          │
  │  For each pending event:                                 │
  │                                                          │
  │    ┌── Action starter? (move, switch, drag)              │
  │    │   YES ──▶ format log + dispatch (log appears first) │
  │    │           wait LOG_READ (1s) for player to read     │
  │    └── NO  ──▶ (log deferred until after state change)   │
  │                                                          │
  │    ┌── Has animEvent?                                    │
  │    │   YES ──▶ await playAnimation(animEvent)            │
  │    │          │                                          │
  │    │          ▼                                          │
  │    │   ┌──────────────────────────────────────┐          │
  │    │   │  playAnimationEvent(scene, event)     │          │
  │    │   │                                       │          │
  │    │   │  switch (event.type)                  │          │
  │    │   │    'move'   → lookup registry         │          │
  │    │   │              → play move anim         │          │
  │    │   │    'damage' → flinch + popup          │          │
  │    │   │    'faint'  → drop + fade             │          │
  │    │   │    'switch-in' → materialize          │          │
  │    │   │    ...                                │          │
  │    │   └──────────────────────────────────────┘          │
  │    │                                                     │
  │    └── NO ──▶ (skip animation)                           │
  │                                                          │
  │    battle.add(args, kwArgs)  ◀── state mutates           │
  │    if state-changing → dispatch re-render (HP drops)     │
  │                                                          │
  │    ┌── Consequence event? (not action starter)           │
  │    │   YES ──▶ wait LOG_READ (if animated)               │
  │    │           dispatch log line (e.g. "lost 17%")       │
  │    └── NO  ──▶ (log was already shown before animation)  │
  │                                                          │
  │  Finally:                                                │
  │    battle.update(request)                                │
  │    dispatch (turnProcessing: false → action panel shows) │
  └──────────────────────────────────────────────────────────┘
```

### Key Abstractions

```
  ┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
  │ AnimationEvent   │     │ AnimationScene    │     │ SpriteHandle     │
  │                 │     │                  │     │                  │
  │ What to animate │────▶│ How to animate   │────▶│ What to animate  │
  │ (data)          │     │ (capabilities)   │     │ ON (DOM target)  │
  │                 │     │                  │     │                  │
  │ type: 'move'    │     │ getSprite()      │     │ ident            │
  │ attacker: '...' │     │ showEffect()     │     │ getRect()        │
  │ moveName: '...' │     │ showPopup()      │     │ setTransform()   │
  └─────────────────┘     │ shakeScreen()    │     └──────────────────┘
                          │ flashOverlay()   │
                          │ delay()          │
                          └──────────────────┘
```

- **AnimationEvent** — pure data describing what happened (extracted from protocol)
- **AnimationScene** — stable interface for triggering visual effects (provided by AnimationProvider)
- **SpriteHandle** — per-Pokemon interface for reading position and applying transforms (registered by PokemonSprite)

## AnimationEvent Types

```typescript
type AnimationEvent =
  | { type: 'move'; attacker: string; defender: string; moveName: string }
  | { type: 'damage'; pokemon: string; prevHp: number; newHp: number; maxHp: number }
  | { type: 'heal'; pokemon: string; prevHp: number; newHp: number; maxHp: number }
  | { type: 'faint'; pokemon: string }
  | { type: 'switch-out'; pokemon: string }
  | { type: 'switch-in'; pokemon: string; species: string }
  | { type: 'boost'; pokemon: string; stat: string; amount: number }
  | { type: 'unboost'; pokemon: string; stat: string; amount: number }
  | { type: 'status'; pokemon: string; status: string }
  | { type: 'weather'; weather: string }
  | { type: 'terrain'; terrain: string }
  | { type: 'supereffective' }
  | { type: 'resisted' }
  | { type: 'crit' }
  | { type: 'miss' };
```

### Event Extraction

`extractAnimationEvent(args, battle)` in `animation-events.ts` maps protocol commands to animation events. It runs **before** `battle.add()` so it can read current state:

```
  Protocol command        AnimationEvent produced
  ─────────────────       ──────────────────────────────────
  |move|p1a: X|Y|p2a: Z  { type: 'move', attacker, defender, moveName }
  |-damage|p2a: X|120/270 { type: 'damage', pokemon, prevHp: 270, newHp: 120, maxHp: 270 }
  |-heal|p1a: X|200/266   { type: 'heal', pokemon, prevHp: 180, newHp: 200, maxHp: 266 }
  |faint|p2a: X           { type: 'faint', pokemon }
  |switch|p1a: X|Y|...    { type: 'switch-in', pokemon, species }
  |-boost|p1a: X|atk|1    { type: 'boost', pokemon, stat: 'atk', amount: 1 }
  |-status|p2a: X|brn     { type: 'status', pokemon, status: 'brn' }
  |-weather|Sun            { type: 'weather', weather: 'Sun' }
  |-supereffective|...     { type: 'supereffective' }
  |-crit|...               { type: 'crit' }
  |-miss|...               { type: 'miss' }
```

Events like `|upkeep|`, `|turn|`, `|request|` produce `null` (no animation needed).

## AnimationScene — The Rendering Interface

The `AnimationScene` interface is the bridge between animation logic and the DOM. Every move animation function receives it as the first parameter:

```typescript
interface AnimationScene {
  arenaRef: React.RefObject<HTMLDivElement | null>;
  getSprite: (ident: string) => SpriteHandle | null;
  showEffect: (config: EffectSpriteConfig) => Promise<void>;
  showPopup: (config: PopupConfig) => void;
  shakeScreen: (intensity?: number, duration?: number) => Promise<void>;
  flashOverlay: (color: string, duration?: number) => Promise<void>;
  delay: (ms: number) => Promise<void>;
}
```

| Method | Purpose | Async? |
|--------|---------|--------|
| `getSprite(ident)` | Get a Pokemon's position and transform handle | No |
| `showEffect(config)` | Render a projectile/effect sprite; resolves when the transition completes and auto-removes the effect | Yes |
| `showPopup(config)` | Show floating text (damage number, stat label) | No |
| `shakeScreen(intensity, duration)` | Shake the entire arena | Yes |
| `flashOverlay(color, duration)` | Flash a color overlay on the arena | Yes |
| `delay(ms)` | Wait for a duration | Yes |

### SpriteHandle

Each `PokemonSprite` component registers a `SpriteHandle` with the animation context:

```typescript
interface SpriteHandle {
  ident: string;                                    // "p1a: Charizard"
  getRect: () => DOMRect | null;                    // current bounding box
  setTransform: (t: SpriteTransform) => void;       // apply position/scale/opacity
}
```

Move animations use `getRect()` to compute start/end coordinates for projectiles, and `setTransform()` to animate the Pokemon sprite itself (lunge, recoil, dodge, etc.).

```typescript
interface SpriteTransform {
  x?: number;       // horizontal offset from resting position
  y?: number;       // vertical offset
  scale?: number;   // scale multiplier (1.0 = normal)
  rotate?: number;  // rotation in degrees
  opacity?: number; // 0–1
}
```

### EffectSpriteConfig

Configuration for a temporary animated sprite (projectile, explosion, particle):

```typescript
interface EffectSpriteConfig {
  id: string;              // unique ID for removal
  sprite: string;          // sprite name (maps to CDN URL)
  startX: number;          // initial X position (relative to arena)
  startY: number;          // initial Y position
  endX: number;            // final X position
  endY: number;            // final Y position
  width?: number;          // sprite width (default 40)
  height?: number;         // sprite height (default 40)
  transition?: Transition; // Motion transition config (duration, ease)
  exit?: 'fade' | 'explode'; // exit animation style
  tint?: string;           // CSS filter for color tinting
}
```

### PopupConfig

Configuration for floating text overlays:

```typescript
interface PopupConfig {
  id: string;              // unique ID
  text: string;            // display text ("-45%", "+2 Atk", etc.)
  sprite: SpriteHandle | null; // resolved sprite for positioning
  color?: string;          // text color
  duration?: number;       // ms before auto-removal (default 1000)
}
```

Callers resolve the sprite handle via `scene.getSprite(ident)` and pass it directly. The `PopupLayer` uses `sprite.getRect()` to position the popup above the target Pokemon, with a centered fallback when `sprite` is `null`.

## State Transition Animations

These are the "always-on" animations handled by `playAnimationEvent()` in `state-anims.ts`. They play for every battle regardless of the specific move used.

### Damage

```
  Defender sprite flinches (rapid x-shake via keyframes):
    x: [0, -6, 6, -4, 4, -2, 0]  over DURATION.DAMAGE

  Red damage popup floats up:
    "-{percent}%"  e.g. "-45%"
```

### Heal

```
  Green heal popup floats up:
    "+{percent}%"  e.g. "+25%"
```

### Faint

```
  Sprite drops downward and fades:
    y: 0 → +40
    opacity: 1 → 0
    scale: 1 → 0.8
    duration: 500ms, ease: ACCEL
```

### Switch In / Switch Out

```
  Switch out:
    Red flash overlay (rgba(239, 68, 68, 0.2))
    Two-step shrink with upward lift:
      step 1: scale: 1 → 0.6, opacity: 1 → 0.5, y: 0 → -10  (200ms)
      step 2: scale: 0.6 → 0, opacity: 0.5 → 0, y: -10 → -20

  Switch in:
    Note: playSwitchIn waits 50ms for React to mount the sprite before animating
    Starts invisible: scale: 0, opacity: 0, y: 20
    White flash overlay (rgba(255, 255, 255, 0.25))
    Overshoot: scale → 1.15, opacity → 1, y → -5  (300ms)
    Settle: scale → 1.0, opacity → 1, y → 0
```

### Boost / Unboost

```
  Boost:
    Green flash overlay (rgba(34,197,94,0.15))
    Popup: "↑{amount} {Stat}" in green

  Unboost:
    Red flash overlay (rgba(239,68,68,0.15))
    Popup: "↓{amount} {Stat}" in red
```

### Status

```
  Status-colored flash overlay:
    brn → rgba(249,115,22,0.2)  (orange)
    par → rgba(234,179,8,0.2)   (yellow)
    psn/tox → rgba(168,85,247,0.2) (purple)
    frz → rgba(96,165,250,0.2)  (blue)
    slp → rgba(148,163,184,0.2) (slate)
    default → rgba(156,163,175,0.15)
```

### Effectiveness (Super Effective, Crit, Miss)

```
  Super effective:
    shakeScreen(intensity: 4, duration: 300ms)
    flashOverlay(white, 150ms)

  Critical hit:
    shakeScreen(intensity: 6, duration: 300ms)
    flashOverlay(gold, 150ms)

  Miss:
    flashOverlay(gray, 150ms)
```

### Weather and Terrain

```
  Brief delay (200ms)
  Visual change handled by BattlefieldBg CSS transitions
```

## Move Animations

### Move Animation Registry

`move-registry.ts` provides `getMoveAnimation(moveName)` which resolves move names to animation functions using a 3-tier lookup:

```
  getMoveAnimation('Fire Blast')
        │
        ├── 1. Cache — previously resolved MoveAnimFn
        │   → immediate return
        │
        ├── 2. Lazy registry — hand-written custom animations (20 moves)
        │   → dynamic import('./move-anims/...')
        │   → cache result
        │
        ├── 3. Server-delivered configs — template-based (172 moves in catalog)
        │   → resolveTemplate(config) → MoveAnimFn
        │   → no dynamic import needed
        │
        └── 4. Return null → generic fallback handles it
```

```typescript
type MoveAnimFn = (
  scene: AnimationScene,
  attacker: SpriteHandle,
  defender: SpriteHandle
) => Promise<void>;

// Lookup (at animation time):
const anim = await getMoveAnimation('Fire Blast');
// → checks cache, then lazy registry, then server configs
// → returns MoveAnimFn or null
```

Move names are normalized for lookup: `toLowerCase().replace(/[\s\-]/g, '')`. So "Close Combat", "close-combat", and "closecombat" all resolve to the same animation.

Hand-written animations in the lazy registry take priority over server-delivered configs. This allows custom animations to override a template config when a move needs more expressive choreography than a template can provide.

### Server-Delivered Move Configs

Move animation configs are **not** bundled on the client. They are delivered by the server via the `BATTLE_START` and `BATTLE_RESTORED` WebSocket events. The server maintains a catalog of 172 moves in `packages/backend/pokehub-move-anim-catalog/`.

**Per-player filtering:** Only configs for the player's own team's moves are sent. The opponent's move configs are withheld to prevent moveset information from leaking before moves are revealed in battle.

**Loading flow:**

```
  Server                                    Client
  ──────                                    ──────
  BATTLE_START / BATTLE_RESTORED
    │  extractMoveNames(packedTeam)
    │  getMoveAnimConfigs(moveNames)
    │  → { "fireblast": { template: "projectile", config: {...} }, ... }
    │
    └──▶  useBattleState receives event
          │
          └──▶  loadServerMoveConfigs(configs)
                │  serverConfigs.clear()
                │  store configs in Map<string, MoveAnimConfig>
                │
                (configs available for lookup in getMoveAnimation)
```

`loadServerMoveConfigs()` is called by `useBattleState` when `BATTLE_START` or `BATTLE_RESTORED` arrives. It clears and repopulates the internal `serverConfigs` Map, ensuring a clean slate at the start of each battle.

The server-side catalog (`move-anim-catalog.ts`) maps normalized move names to `MoveAnimConfig` entries:

```typescript
// Server: packages/backend/pokehub-move-anim-catalog/src/lib/move-anim-catalog.ts
const catalog = new Map<string, MoveAnimConfig>([
  ['fireblast', { template: 'projectile', config: { sprite: 'flareball', tint: '#ff3300', flash: 'rgba(255,80,0,0.18)', size: 56, speed: 0.28 } }],
  ['hydropump', { template: 'projectile', config: { sprite: 'waterwisp', tint: '#2288ff', flash: 'rgba(50,130,255,0.18)', size: 52, speed: 0.25 } }],
  // ... 172 entries total
]);
```

### Template-Based Animation System

Five template factory functions in `move-templates.ts` generate `MoveAnimFn` instances from config data:

| Template | Factory | Description |
|----------|---------|-------------|
| `projectile` | `projectile(config)` | Sprite travels from attacker to defender with optional charge-up and recoil |
| `lunge` | `lunge(config)` | Attacker dashes toward defender (multi-hit support) |
| `aoe` | `aoe(config)` | Screen shake + flash overlay (earthquakes, blizzards) |
| `selfBuff` | `selfBuff(config)` | Scale pulse on attacker with optional rotation |
| `statusEffect` | `statusEffect(config)` | Flash overlay + defender shrink/dip |

Server configs use a discriminated union `MoveAnimConfig` (defined in `@pokehub/shared/pokemon-battle-types`) that maps to these templates:

```typescript
// packages/shared/pokemon-battle-types/src/lib/move-anim-config.ts
type MoveAnimConfig =
  | { template: 'projectile'; config: ProjectileConfig }
  | { template: 'lunge'; config?: LungeConfig }
  | { template: 'aoe'; config?: AoeConfig }
  | { template: 'selfBuff'; config?: SelfBuffConfig }
  | { template: 'statusEffect'; config?: StatusEffectConfig };
```

The `resolveTemplate()` function narrows the discriminated union and calls the appropriate factory:

```typescript
function resolveTemplate(entry: MoveAnimConfig): MoveAnimFn {
  switch (entry.template) {
    case 'projectile':   return projectile(entry.config);
    case 'lunge':        return lunge(entry.config);
    case 'aoe':          return aoe(entry.config);
    case 'selfBuff':     return selfBuff(entry.config);
    case 'statusEffect': return statusEffect(entry.config);
  }
}
```

Config interfaces (`ProjectileConfig`, `LungeConfig`, `AoeConfig`, `SelfBuffConfig`, `StatusEffectConfig`) are defined in the shared package `@pokehub/shared/pokemon-battle-types`, not in `move-templates.ts`. This allows both the server catalog and the client templates to share the same types. The `ease` field on `ProjectileConfig` uses `readonly [number, number, number, number]` (a cubic bezier tuple) instead of Motion's `Transition['ease']` to keep the shared types framework-agnostic.

### Lazy Loading

**Hand-written animations** (the 20 moves listed below) are code-split into individual chunks via dynamic imports. Each move file is only downloaded when that move is first used in a battle:

```
  getMoveAnimation('Flamethrower')  — hand-written move
        │
        ├── First call: dynamic import('./move-anims/flamethrower')
        │   → network request for chunk
        │   → cache result
        │
        └── Subsequent calls: return cached MoveAnimFn
```

**Server-delivered configs** do not require dynamic imports. When a server config is matched, `resolveTemplate()` synchronously produces a `MoveAnimFn` from the template factory — no network request is needed because the config data was already delivered with the `BATTLE_START` event.

If a hand-written animation's dynamic import fails (missing file, network error), `getMoveAnimation` falls through to check server configs before returning `null`.

### Generic Fallbacks

When no specific move animation is registered, `playMove` looks up the move's category from `@pkmn/dex` and selects the appropriate generic fallback:

```
  Move lookup
    │
    ├── Found in registry → play specific animation
    │
    └── Not found → Dex.moves.get(moveName).category
                      │
                      ├── 'Physical' → genericPhysical
                      ├── 'Special'  → genericSpecial
                      └── 'Status'   → genericStatus
```

The three generic animations:

**`genericPhysical`** — attacker lunges toward defender:
```
  Attacker: translate 35% toward defender → return
  Impact: white flash at defender position
  Defender: brief x-recoil
```

**`genericSpecial`** — energy projectile:
```
  Attacker: brief scale-up (charge)
  Projectile: 'energyball' sprite from attacker to defender
  Exit: explode at impact point
```

**`genericStatus`** — self-buff pulse:
```
  Attacker: scale pulse 1.0 → 1.08 → 1.0
  Blue flash overlay
```

### Hand-Written Move Animations

20 hand-written move animations are registered in the lazy registry. These are custom-choreographed animations that go beyond what templates can express:

| Move | Category | Animation Style |
|------|----------|----------------|
| **Earthquake** | Physical | Screen shake (intensity 8) + ground flash |
| **Close Combat** | Physical | Rapid 3-hit lunge combo |
| **U-turn** | Physical | Dash through defender → switch out |
| **Knock Off** | Physical | Dark slash effect |
| **Flamethrower** | Special | Fireball projectile, orange flash |
| **Thunderbolt** | Special | Lightning bolt, yellow flash |
| **Ice Beam** | Special | Ice shard projectile, blue flash |
| **Scald** | Special | Water stream, blue-teal flash |
| **Draco Meteor** | Special | Meteors falling from above |
| **Surf** | Special | Wave sweep across field |
| **Moonblast** | Special | Pink sparkle beam |
| **Shadow Ball** | Special | Dark orb projectile |
| **Stealth Rock** | Status | Screen shake + brown flash |
| **Toxic** | Status | Purple wisp arc to defender |
| **Will-O-Wisp** | Status | Blue flame wisps |
| **Swords Dance** | Status | Attacker glow + sword flash |
| **Dragon Dance** | Status | Scale pulse + dragon flash |
| **Calm Mind** | Status | Gentle glow pulse |
| **Defog** | Status | Wind sweep, screen shake |
| **Roost** | Status | Feather particle + green heal flash |

An additional **172 moves** are covered by server-delivered template configs (see [Server-Delivered Move Configs](#server-delivered-move-configs)).

## Easing and Duration Constants

Named cubic-bezier curves in `easing.ts`:

```typescript
const BALLISTIC = [0.5, -0.3, 0.7, 1.3]  // parabolic arc (projectiles)
const ACCEL     = [0.4, 0, 1, 1]          // accelerate from rest
const DECEL     = [0, 0, 0.2, 1]          // decelerate to rest (arrivals)
const SWING     = [0.36, 0.07, 0.19, 0.97]
const LINEAR    = [0, 0, 1, 1]
const SNAPPY    = [0.2, 0, 0, 1]          // sharp impact feeling
const ELASTIC   = [0.68, -0.55, 0.27, 1.55] // overshoot and settle
```

Duration constants (milliseconds):

```typescript
const DURATION = {
  MOVE: 800,
  DAMAGE: 1000,
  FAINT: 800,
  SWITCH_OUT: 500,
  SWITCH_IN: 700,
  BOOST: 500,
  STATUS: 500,
  SUPER_EFFECTIVE: 400,
  CRIT: 400,
  WEATHER: 900,
  SCREEN_SHAKE: 400,
  FLASH: 250,
  POPUP: 1000,
  LOG_READ: 1000,   // pause after log line appears, before animation starts
};
```

`LOG_READ` controls the pause between a log entry appearing and its corresponding animation playing. This gives the player time to read "Charizard used Flamethrower!" before the move animation fires. For consequence events (damage, heal), `LOG_READ` is the pause between the HP bar updating and the log message appearing (e.g., "lost 17% of its health!"). These pauses only apply when animations are active — during non-animated processing (battle start, restore), events are applied instantly.

## Visual Layers

The arena stacks multiple visual layers using `z-index`:

```
  ┌────────────────────────────────────────┐
  │  Flash overlay          (z-50)         │  ← fullscreen color flash
  │  ┌────────────────────────────────┐    │
  │  │  Popup layer         (z-40)    │    │  ← damage numbers float up
  │  │  ┌────────────────────────┐    │    │
  │  │  │  Effect layer  (z-30)  │    │    │  ← projectile sprites
  │  │  │  ┌────────────────┐    │    │    │
  │  │  │  │  Pokemon sprites│   │    │    │  ← z-10, motion.div
  │  │  │  │  (p1 + p2)     │   │    │    │
  │  │  │  └────────────────┘    │    │    │
  │  │  └────────────────────────┘    │    │
  │  └────────────────────────────────┘    │
  │  Background gradient    (z-0)          │  ← weather/terrain CSS
  └────────────────────────────────────────┘
```

### EffectLayer (Projectile Sprites)

Renders `EffectSpriteConfig[]` as `motion.img` elements. Each sprite:
- Animates from `(startX, startY)` to `(endX, endY)` using the configured transition
- Uses `AnimatePresence` for exit animations (`fade` or `explode`)
- Auto-removed when the transition completes (`showEffect` resolves)
- Sprite images loaded from Showdown CDN (see [Effect Sprite CDN](#effect-sprite-cdn))

### PopupLayer (Damage Numbers)

Renders `PopupConfig[]` as floating text positioned above the target Pokemon:
- Positioned using `config.sprite?.getRect()` relative to the arena, with centered fallback
- Animates upward with fade-out over `duration` ms (default 1000)
- Auto-removed after duration via `setTimeout`

### Flash Overlay

A full-arena `div` with `pointer-events: none` that shows a semi-transparent color:
- Controlled by `flashColor` state in `AnimationProvider`
- `flashOverlay(color, duration)` sets the color, waits, then clears it
- Used for super-effective hits (white), crits (gold), status effects (type-specific colors)

### Screen Shake

The arena `motion.div` has its `x` and `y` animated by `shakeOffset`:
- `shakeScreen(intensity, duration)` runs a loop setting random offsets with decay
- Each step waits 50ms, with decreasing intensity
- Resets to `{x: 0, y: 0}` when complete

## PokemonSprite — Animation Target

The `PokemonSprite` component wraps its sprite image in a `motion.div` and registers a `SpriteHandle` with the animation context:

```
  PokemonSprite
  ├── motion.div (animatable wrapper)
  │   ├── Applies transform: { x, y, scale, rotate, opacity }
  │   ├── These values are set by animation functions via setTransform()
  │   └── Motion interpolates smoothly between values
  │
  ├── Image (from @pkmn/img Sprites.getPokemon())
  │   ├── gen5ani sprites (animated GIFs)
  │   ├── Back sprites for player side, front for opponent
  │   └── Shiny/gender variants supported
  │
  ├── Shadow ellipse (fades on faint)
  │
  └── Registers SpriteHandle on mount:
      { ident, getRect, setTransform }
      Unregisters on unmount
```

The `fainted` state overrides with a drop+fade transform, taking priority over animation-driven transforms.

## Adding a New Move Animation

There are two ways to add a move animation: adding a **server catalog entry** (preferred for most moves) or writing a **hand-written animation** (for moves that need custom choreography).

### Option A: Add a Server Catalog Entry (Recommended)

For moves that fit one of the five templates (`projectile`, `lunge`, `aoe`, `selfBuff`, `statusEffect`), add an entry to the server catalog. This requires no client-side code changes and no additional JavaScript bundle size.

Add the entry in `packages/backend/pokehub-move-anim-catalog/src/lib/move-anim-catalog.ts`:

```typescript
['hydropump', { template: 'projectile', config: { sprite: 'waterwisp', tint: '#2288ff', flash: 'rgba(50,130,255,0.18)', size: 52, speed: 0.25 } }],
```

The config will be delivered to the client via `BATTLE_START` and resolved to a `MoveAnimFn` at runtime using `resolveTemplate()`. No dynamic import or client-side registration is needed.

### Option B: Write a Hand-Written Animation

For moves that need choreography beyond what the templates support (multi-phase sequences, unique particle effects, conditional logic), create a hand-written animation file.

#### Step 1: Create the Animation File

Create a new file in `animations/move-anims/`:

```typescript
// animations/move-anims/hydro-pump.ts
import type { MoveAnimFn } from '../../types/animation.types';
import { EASING, DURATION } from '../easing';

const hydroPump: MoveAnimFn = async (scene, attacker, defender) => {
  const atkRect = attacker.getRect();
  const defRect = defender.getRect();
  const arenaRect = scene.arenaRef.current?.getBoundingClientRect();
  if (!atkRect || !defRect || !arenaRect) return;

  // Compute positions relative to arena
  const startX = atkRect.left - arenaRect.left + atkRect.width / 2;
  const startY = atkRect.top - arenaRect.top + atkRect.height / 2;
  const endX = defRect.left - arenaRect.left + defRect.width / 2;
  const endY = defRect.top - arenaRect.top + defRect.height / 2;

  // Charge-up
  attacker.setTransform({ scale: 1.05 });
  await scene.delay(150);
  attacker.setTransform({ scale: 1 });

  // Fire projectile — resolves when transition completes, auto-removes
  scene.flashOverlay('rgba(59, 130, 246, 0.2)', 400);
  await scene.showEffect({
    id: `hydropump-${crypto.randomUUID()}`,
    sprite: 'waterwisp',
    startX, startY, endX, endY,
    width: 50, height: 30,
    transition: { duration: 0.45, ease: EASING.BALLISTIC },
    exit: 'explode',
  });

  // Impact recoil
  defender.setTransform({ x: -5 });
  await scene.delay(100);
  defender.setTransform({ x: 0 });
};

export default hydroPump;
```

#### Step 2: Register It

Add the registration in `move-registry.ts`:

```typescript
registerMoveAnimation('hydropump', () => import('./move-anims/hydro-pump'));
```

The normalized key removes spaces and hyphens, so "Hydro Pump" → `"hydropump"`.

Hand-written animations take priority over server catalog entries for the same move. If a move has both a hand-written animation and a server catalog entry, the hand-written version is used.

### Animation Patterns

Common patterns used across move animations:

**Projectile move** (Flamethrower, Ice Beam, Shadow Ball):
```
  1. Compute start/end from attacker/defender rects
  2. Attacker charge-up (brief scale pulse)
  3. Fire flashOverlay() (non-awaited, runs concurrently)
  4. await showEffect() — projectile travels, auto-removes on completion
  5. Defender recoil (setTransform x-offset → reset)
```

**Screen/AoE move** (Earthquake, Surf):
```
  1. shakeScreen() with appropriate intensity
  2. flashOverlay() with thematic color
  3. Defender recoil
```

**Contact/physical move** (Close Combat, U-turn):
```
  1. Attacker lunges toward defender (setTransform x/y toward target)
  2. Impact effect at contact point
  3. Attacker returns to resting position
  4. Defender recoil
```

**Status/self-buff** (Swords Dance, Calm Mind):
```
  1. Attacker scale pulse
  2. Thematic flash overlay
  3. Optional popup text
```

## Effect Sprite CDN

Effect sprites are loaded from Pokemon Showdown's CDN:

```
https://play.pokemonshowdown.com/fx/{name}.png
```

Common sprite names used in move animations:

| Sprite Name | Visual | Used By |
|-------------|--------|---------|
| `fireball` | Orange flame orb | Flamethrower, Will-O-Wisp |
| `electroball` | Yellow lightning orb | Thunderbolt |
| `icicle` | Blue ice shard | Ice Beam |
| `waterwisp` | Blue water droplet | Scald, Surf |
| `shadowball` | Dark purple orb | Shadow Ball |
| `energyball` | Green energy orb | Generic special, Moonblast |
| `poisonwisp` | Purple toxic wisp | Toxic |
| `rock1` / `rock2` | Brown rocks | Stealth Rock |
| `feather` | White feather | Roost, Defog |
| `fist` | Impact fist | Close Combat |

## Turn Processing and Action Panel

The `turnProcessing` flag in `BattleUIState` controls whether the action panel is visible:

- **`turnProcessing: true`** — set on every intermediate `_BATTLE_UPDATED` dispatch during `processPendingEvents`. The action panel is hidden so the player cannot submit moves while the turn is animating.
- **`turnProcessing: false`** — set on the final dispatch in `processPendingEvents`'s `finally` block, after all events are processed and `battle.update(request)` is called. The action panel reappears with the new request's available moves/switches.
- **`_BATTLE_INITIALIZED` / `_BATTLE_RESTORED`** — do not set `turnProcessing`, so it keeps the default `false`. The action panel shows immediately for initial team selection.

```
  Turn lifecycle:
    Server sends BATTLE_UPDATE
      → events parsed, pushed to pending queue
      → processPendingEvents() starts
      → turnProcessing: true (action panel hidden)
      → animations play, state changes apply
      → finally: battle.update(request), turnProcessing: false
      → action panel reappears with new moves
```

## Related Documentation

- [Battle Frontend Architecture](./battle-frontend-architecture.md) — state management, protocol pipeline, component structure
- [@pkmn Integration Guide](./battle-pkmn-integration.md) — how @pkmn packages power the frontend
- [Battle System (Backend)](./battle-system.md) — server architecture, @pkmn/sim usage
