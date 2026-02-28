# Template-Based Move Animation System

## Context

We have 20 hand-written move animations and 900+ moves in the game. The generic fallbacks cover everything, but common competitive moves deserve better visuals. Most hand-written moves follow identical patterns — flamethrower, ice beam, shadow ball, scald, moonblast, and thunderbolt are all "projectile with different sprite/color". Writing a separate file for each is unnecessary duplication.

The goal: cover 100+ of the most-used competitive moves with minimal code, while keeping the option to write fully custom animations for showcase moves.

## Design

### Template factories in `move-templates.ts`

Five factory functions that return `MoveAnimFn`, covering all current patterns:

```typescript
// 1. Projectile — attacker fires a sprite at defender
//    Covers: Flamethrower, Ice Beam, Shadow Ball, Scald, Moonblast,
//            Thunderbolt, Energy Ball, Psychic, Dark Pulse, Aura Sphere,
//            Flash Cannon, Sludge Bomb, Focus Blast, etc.
projectile(config: {
  sprite: string;          // CDN sprite name
  tint?: string;           // CSS color for tint
  flash?: string;          // overlay color (rgba)
  size?: number;           // sprite size (default 40)
  speed?: number;          // transition duration (default 0.3)
  ease?: number[];         // easing curve (default ACCEL)
  recoil?: number;         // defender knockback px (default 6)
  chargeUp?: boolean;      // attacker scale pulse before firing (default true)
})

// 2. Lunge — attacker charges at defender (physical contact)
//    Covers: Close Combat, Brick Break, Iron Head, Body Slam,
//            Crunch, Waterfall, Zen Headbutt, Play Rough, etc.
lunge(config?: {
  distance?: number;       // fraction of gap to close (default 0.35)
  hits?: number;           // multi-hit count (default 1)
  flash?: string;          // overlay color per hit
  scale?: number;          // attacker scale during lunge (default 1.1)
  recoil?: number;         // defender knockback (default 8)
})

// 3. AoE / screen effect — no projectile, just shake + flash
//    Covers: Earthquake, Rock Slide, Discharge, Blizzard,
//            Heat Wave, Explosion, Hyper Voice, Boomburst, etc.
aoe(config?: {
  shake?: number;          // screen shake intensity (default 4)
  shakeDuration?: number;  // shake ms (default 400)
  flash?: string;          // overlay color
  recoil?: number;         // defender knockback (default 4)
})

// 4. Self-buff — attacker glows/pulses
//    Covers: Swords Dance, Dragon Dance, Calm Mind, Nasty Plot,
//            Bulk Up, Iron Defense, Agility, Quiver Dance,
//            Shell Smash, Shift Gear, Hone Claws, etc.
selfBuff(config?: {
  flash?: string;          // overlay color
  pulses?: number;         // number of scale pulses (default 1)
  scale?: number;          // pulse scale (default 1.08)
  rotate?: boolean;        // add rotation wobble (default false)
})

// 5. Status application — targets the defender
//    Covers: Toxic, Thunder Wave, Will-O-Wisp, Spore, Sleep Powder,
//            Glare, Stun Spore, Yawn, etc.
statusEffect(config?: {
  flash?: string;          // overlay color
  defenderShrink?: number; // defender scale dip (default 0.97)
})
```

### File: `animations/move-templates.ts`

Each factory:
- Takes a config object with sensible defaults
- Returns a `MoveAnimFn` (same type as hand-written moves)
- Handles rect validation and null sprites internally
- Reuses the exact same animation logic as the existing hand-written moves

### File: `animations/move-catalog.ts`

A single data file that maps move names to template calls. This replaces dozens of individual files:

```typescript
import { projectile, lunge, aoe, selfBuff, statusEffect } from './move-templates';
import { registerMoveAnimation } from './move-registry';
import type { MoveAnimFn } from '../types/animation.types';

// Each entry is: [normalizedName, factory call]
const catalog: [string, MoveAnimFn][] = [
  // Fire
  ['fireblast',     projectile({ sprite: 'flareball', tint: '#ff4400', flash: 'rgba(255,80,0,0.15)', size: 56 })],
  ['overheat',      projectile({ sprite: 'flareball', tint: '#ff2200', flash: 'rgba(255,50,0,0.2)', size: 52, speed: 0.25 })],
  ['lavaplume',     aoe({ flash: 'rgba(255,80,0,0.15)', shake: 3 })],
  ['heatwave',      aoe({ flash: 'rgba(255,100,0,0.12)', shake: 3 })],

  // Water
  ['hydropump',     projectile({ sprite: 'waterwisp', tint: '#2288ff', flash: 'rgba(50,130,255,0.15)', size: 52, speed: 0.25 })],

  // Fighting
  ['brickbreak',    lunge({ flash: 'rgba(255,255,255,0.12)' })],
  ['machpunch',     lunge({ distance: 0.4, flash: 'rgba(255,255,255,0.1)' })],

  // Status / Buff
  ['nastyplot',     selfBuff({ flash: 'rgba(100,50,50,0.15)', pulses: 2 })],
  ['irondefense',   selfBuff({ flash: 'rgba(180,180,200,0.2)' })],

  // Status application
  ['thunderwave',   statusEffect({ flash: 'rgba(234,179,8,0.25)' })],
  ['sleeppowder',   statusEffect({ flash: 'rgba(100,200,100,0.2)' })],
  // ... 80+ more entries
];

for (const [name, anim] of catalog) {
  registerMoveAnimation(name, () => Promise.resolve({ default: anim }));
}
```

### What happens to existing hand-written moves?

**Keep them.** Custom animations like Draco Meteor (multi-flash sequence), U-Turn (sweep-through + fade), Close Combat (multi-angle lunge loop) are more expressive than any template. The registry checks custom files first, catalog entries second.

**Optionally migrate** simple ones (flamethrower → `projectile(...)`, earthquake → `aoe(...)`, toxic → `statusEffect(...)`) to reduce file count — but no urgency.

### Registration order / priority

The current `move-registry.ts` handles this naturally — first registration wins. So:
1. `move-registry.ts` registers custom animations (existing hand-written files)
2. `move-catalog.ts` is imported after — its `registerMoveAnimation` calls are no-ops for already-registered moves

### Bundle impact

- `move-templates.ts` — included in initial bundle (~200 lines, small)
- `move-catalog.ts` — included in initial bundle (data only, ~5 bytes per entry)
- No code splitting needed since templates are tiny and shared
- Custom hand-written moves still lazy-load as before

## Files to create/modify

| File | Action | Lines |
|------|--------|-------|
| `animations/move-templates.ts` | **Create** | ~200 |
| `animations/move-catalog.ts` | **Create** | ~150 (grows as we add moves) |
| `animations/move-registry.ts` | **Modify** — add `import './move-catalog'` at bottom, add a guard in `registerMoveAnimation` to skip duplicates | ~5 lines changed |

## Verification

- Existing hand-written moves still play correctly (registry priority unchanged)
- Catalog moves play their template animation instead of generic fallback
- `nx build pokehub-app` passes
- No import changes needed outside the animations directory
