# @pkmn Integration Guide

## Table of Contents

- [Overview](#overview)
- [Package Map](#package-map)
- [@pkmn/dex and @pkmn/data — Pokemon Database](#pkmndex-and-pkmndata--pokemon-database)
  - [Lazy Initialization](#lazy-initialization)
  - [What Generations Provides](#what-generations-provides)
- [@pkmn/client — Battle State Machine](#pkmnclient--battle-state-machine)
  - [Creating a Battle](#creating-a-battle)
  - [Battle.add() — Protocol Event Application](#battleadd--protocol-event-application)
  - [Battle.update() — Request Synchronization](#battleupdate--request-synchronization)
  - [Reading Battle State](#reading-battle-state)
  - [The Side and Pokemon Objects](#the-side-and-pokemon-objects)
  - [Request Object](#request-object)
  - [Field State](#field-state)
- [@pkmn/protocol — Protocol Parsing](#pkmnprotocol--protocol-parsing)
  - [Protocol.parse()](#protocolparse)
  - [ArgType and BattleArgsKWArgType](#argtype-and-battleargskwargtype)
  - [Protocol Event Categories](#protocol-event-categories)
- [@pkmn/view — Log Formatting](#pkmnview--log-formatting)
  - [LogFormatter](#logformatter)
  - [Perspective](#perspective)
- [@pkmn/img — Sprite URLs](#pkmnimg--sprite-urls)
  - [Sprites.getPokemon()](#spritesgetpokemon)
- [Data Flow Through @pkmn](#data-flow-through-pkmn)
  - [Full Turn Lifecycle](#full-turn-lifecycle)
  - [Battle Initialization](#battle-initialization)
  - [Battle Restoration (Reconnect)](#battle-restoration-reconnect)
- [Key Constraints and Gotchas](#key-constraints-and-gotchas)
- [Related Documentation](#related-documentation)

---

## Overview

The frontend battle system is built entirely on the `@pkmn` ecosystem — a TypeScript reimplementation of Pokemon Showdown's client-side logic. These packages provide:

- A complete Pokemon database (moves, abilities, items, species, type chart)
- A client-side battle state machine that mirrors the server's state
- A protocol parser for Showdown's text-based battle protocol
- A log formatter for human-readable battle text
- Sprite URL generation for all Pokemon

The server runs `@pkmn/sim` (the battle engine) and sends protocol text to the frontend. The frontend uses `@pkmn/client` to replay that protocol locally, maintaining a synchronized view of the battle state without needing the full simulation.

## Package Map

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                        @pkmn Ecosystem                         │
  │                                                                │
  │  ┌────────────┐    ┌────────────┐    ┌─────────────────────┐   │
  │  │  @pkmn/dex │───▶│ @pkmn/data │───▶│  @pkmn/client       │   │
  │  │            │    │            │    │  Battle state machine│   │
  │  │  Raw data  │    │ Generations│    │  .add() .update()   │   │
  │  │  (pokedex) │    │ (typed API)│    └─────────────────────┘   │
  │  └────────────┘    └────────────┘              ▲               │
  │                                                │               │
  │  ┌──────────────┐              ┌───────────────┘               │
  │  │ @pkmn/protocol│             │  Protocol text                │
  │  │              │              │                               │
  │  │ .parse()     │──────────────┘                               │
  │  │ ArgType      │                                              │
  │  └──────────────┘                                              │
  │                                                                │
  │  ┌────────────┐    ┌────────────┐                              │
  │  │ @pkmn/view │    │ @pkmn/img  │                              │
  │  │            │    │            │                              │
  │  │ LogFormatter│   │ Sprite URLs│                              │
  │  └────────────┘    └────────────┘                              │
  └─────────────────────────────────────────────────────────────────┘

  Server (@pkmn/sim) ──── protocol text ────▶ Frontend (@pkmn/client)
```

| Package | Version | Purpose | Where Used |
|---------|---------|---------|------------|
| `@pkmn/dex` | — | Raw Pokemon data (species, moves, items, abilities) | `use-battle-state.ts` |
| `@pkmn/data` | — | Typed `Generations` API wrapping Dex | `use-battle-state.ts` |
| `@pkmn/client` | — | `Battle` class — client-side state machine | `use-battle-state.ts`, components |
| `@pkmn/protocol` | — | `Protocol.parse()`, `ArgType`, `BattleArgsKWArgType` | `use-battle-state.ts` |
| `@pkmn/view` | — | `LogFormatter` — protocol to human-readable HTML | `use-battle-state.ts`, `battle-log.tsx` |
| `@pkmn/img` | — | `Sprites.getPokemon()` — sprite URL generation | `pokemon-sprite.tsx` |

## @pkmn/dex and @pkmn/data — Pokemon Database

### Lazy Initialization

The `Generations` object wraps the full `Dex` and is expensive to construct (it indexes all 1000+ species, moves, abilities, etc.). It's lazily initialized on first use:

```typescript
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';

let gens: Generations | null = null;
function getGenerations(): Generations {
  if (!gens) gens = new Generations(Dex);
  return gens;
}
```

This singleton is shared across all battles in the same browser session. It's passed to the `Battle` constructor so the battle engine knows the complete data for whatever generation is being played.

### What Generations Provides

The `Battle` class uses `Generations` internally to look up:

- **Species** — base stats, types, abilities, forme changes
- **Moves** — type, power, accuracy, PP, category (physical/special/status), flags
- **Abilities** — effects, interactions
- **Items** — effects, interactions
- **Type chart** — effectiveness calculations (for UI hints like "super effective")

The frontend doesn't query `Generations` directly — it reads the processed data from the `Battle` instance after protocol events are applied.

## @pkmn/client — Battle State Machine

### Creating a Battle

A `Battle` is created when `BATTLE_START` or `BATTLE_RESTORED` arrives:

```typescript
const battle = new Battle(getGenerations());
```

The Battle starts empty. State is populated by feeding it protocol text via `battle.add()`.

### Battle.add() — Protocol Event Application

The core mutation method. Each protocol event parsed by `Protocol.parse()` is applied via:

```typescript
battle.add(args, kwArgs);
```

This mutates the Battle's internal state: switches Pokemon in/out, applies damage, changes status, updates field conditions, etc. The Battle mirrors the server's state after processing the same protocol text.

```
  Protocol text: |-damage|p2a: Venusaur|120/270
                        │
                        ▼
  battle.add(['-damage', 'p2a: Venusaur', '120/270'], {})
                        │
                        ▼
  battle.p2.active[0].hp = 120
  battle.p2.active[0].maxhp = 270
```

### Battle.update() — Request Synchronization

After each turn, the server sends a `|request|` event containing the player's perspective data: their team's HP, PP, status, and available choices. `battle.update(request)` synchronizes this:

```typescript
if (battle.request) {
  battle.update(battle.request);
}
```

**Critical constraint:** `battle.update()` overwrites `pokemon.hp` from the request data. It must only be called **after** all protocol events in a batch have been processed via `battle.add()`. Calling it mid-batch resets HP to the previous turn's values. See [The battle.update() Pitfall](./battle-frontend-architecture.md#the-battleupdate-pitfall).

### Reading Battle State

Components read the Battle object at render time. Key properties:

```typescript
battle.turn          // current turn number (0 = pre-battle)
battle.tier          // format string, e.g. "gen9ou"
battle.gen           // generation number (1–9)

battle.p1            // Side object for player 1
battle.p2            // Side object for player 2

battle.field.weather // active weather ("Sun", "Rain", etc.) or null
battle.field.terrain // active terrain ("Electric", etc.) or null

battle.request       // current request (available moves/switches)
```

### The Side and Pokemon Objects

```
  battle.p1 (Side)
  ├── .name              "Player1"
  ├── .id                "p1"
  ├── .totalPokemon      6
  ├── .faints            number of fainted Pokemon
  ├── .active[0]         currently active Pokemon (or null)
  │   ├── .speciesForme  "Charizard"
  │   ├── .hp            current HP (0–maxhp)
  │   ├── .maxhp         maximum HP
  │   ├── .status        "brn" | "par" | "psn" | "tox" | "slp" | "frz" | ""
  │   ├── .ident         "p1a: Charizard" (unique ID for sprite targeting)
  │   ├── .boosts        { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ... }
  │   ├── .volatiles     { confusion: {...}, substitute: {...}, ... }
  │   ├── .moveTrack     [[moveName, ppUsed], ...] — observed moves
  │   └── .gender        "M" | "F" | "N"
  │
  ├── .team[]            all revealed Pokemon on this side
  └── .sideConditions    { stealthrock: {...}, spikes: {...}, ... }
```

- **Player side**: `battle.request.side.pokemon[]` gives full team data (HP as exact numbers, all moves with PP)
- **Opponent side**: only revealed information is available via `battle[sideId].team[]` — unrevealed Pokemon show as Pokeball placeholders

### Request Object

The `request` object tells the UI what choices are available:

```typescript
battle.request.requestType
  // 'move'   — choose a move or switch
  // 'switch' — forced switch (after faint)
  // 'team'   — team preview (pick lead order)
  // 'wait'   — waiting for opponent

battle.request.active[0].moves[]
  // { name, id, pp, maxpp, target, disabled }

battle.request.active[0].trapped
  // true if switching is not allowed

battle.request.active[0].canMegaEvo
battle.request.active[0].canZMove
battle.request.active[0].canDynamax
battle.request.active[0].canTerastallize

battle.request.side.pokemon[]
  // full team data for the player
```

### Field State

```typescript
battle.field.weather          // "Sun" | "Rain" | "Sand" | "Hail" | "Snow" | ...
battle.field.terrain          // "Electric" | "Grassy" | "Psychic" | "Misty"
battle.field.pseudoWeather    // { trickroom: {...}, gravity: {...}, ... }
```

Each condition includes duration information when applicable (e.g., weather set by a Pokemon with a non-permanent source lasts 5 turns).

## @pkmn/protocol — Protocol Parsing

### Protocol.parse()

Converts raw protocol text (received from the server via WebSocket) into structured event objects:

```typescript
import { Protocol } from '@pkmn/protocol';

const text = `|move|p1a: Charizard|Flamethrower|p2a: Venusaur
|-supereffective|p2a: Venusaur
|-damage|p2a: Venusaur|120/270`;

for (const { args, kwArgs } of Protocol.parse(text)) {
  // args = ['move', 'p1a: Charizard', 'Flamethrower', 'p2a: Venusaur']
  // kwArgs = {}
  //
  // args = ['-supereffective', 'p2a: Venusaur']
  // ...
}
```

### ArgType and BattleArgsKWArgType

These types from `@pkmn/protocol` provide type safety for protocol events:

- **`ArgType`** — a tuple type representing the parsed arguments of a protocol line. `args[0]` is always the command name (e.g., `'move'`, `'-damage'`, `'switch'`)
- **`BattleArgsKWArgType`** — keyword arguments that may accompany a protocol line (e.g., `[from]`, `[of]`, `[silent]`)

Both types are used in the `PendingProtocolEvent` interface:

```typescript
interface PendingProtocolEvent {
  args: ArgType;
  kwArgs: BattleArgsKWArgType;
  animEvent: AnimationEvent | null;
}
```

### Protocol Event Categories

The Showdown protocol has dozens of event types. Key categories:

| Category | Events | Purpose |
|----------|--------|---------|
| **Turn flow** | `turn`, `upkeep`, `request` | Turn boundaries, request for player choice |
| **Moves** | `move` | A Pokemon used a move |
| **Damage/Heal** | `-damage`, `-heal` | HP changes |
| **KO** | `faint` | A Pokemon fainted |
| **Switching** | `switch`, `drag` | Pokemon switched in (voluntary or forced) |
| **Stat stages** | `-boost`, `-unboost`, `-setboost` | Stat stage changes |
| **Status** | `-status`, `-curestatus`, `-cureteam` | Status conditions |
| **Field** | `-weather`, `-fieldstart`, `-fieldend` | Field-wide conditions |
| **Side** | `-sidestart`, `-sideend` | Side-specific conditions (hazards, screens) |
| **Effectiveness** | `-supereffective`, `-resisted`, `-crit`, `-miss`, `-fail`, `-immune`, `-notarget` | Damage modifiers; the four "move didn't connect" events collapse into one `move-failed` animation event |
| **Abilities** | `-ability`, `-endability` | Ability activations |
| **Items** | `-item`, `-enditem` | Item activations/consumption |
| **Meta** | `player`, `teamsize`, `gametype`, `gen`, `tier` | Battle setup |

## @pkmn/view — Log Formatting

### LogFormatter

Converts protocol events into human-readable HTML for the battle log:

```typescript
import { LogFormatter } from '@pkmn/view';

const formatter = new LogFormatter('p1', battle);
const html = formatter.formatHTML(args, kwArgs);
// Returns: "<small>Charizard used <strong>Flamethrower</strong>!</small>"
```

The HTML is collected into `logEntries: string[]` in `BattleUIState` and rendered by `BattleLog` using `dangerouslySetInnerHTML` with scoped Tailwind styles.

### Perspective

The formatter's perspective determines how it refers to Pokemon — "your Charizard" vs "the opposing Charizard":

```typescript
const formatter = new LogFormatter('p1', battle);

// Perspective is set inside processPendingEvents when the |request| event
// is processed — the request contains the player's side assignment:
// (in processPendingEvents loop)
if (cmd === 'request' && battle.request?.side?.id) {
  formatter.perspective = battle.request.side.id; // 'p1' or 'p2'
}

// For BATTLE_RESTORED (instant processing), it's set after processBattleProtocol:
if (battle.request?.side?.id) {
  formatter.perspective = battle.request.side.id;
}
```

## @pkmn/img — Sprite URLs

### Sprites.getPokemon()

Generates sprite image URLs and dimensions:

```typescript
import { Sprites } from '@pkmn/img';

const sprite = Sprites.getPokemon('charizard', {
  gen: 'gen5ani',    // animated Gen 5 sprites
  side: 'p1',        // back sprite (player's side) or 'p2' (front)
  shiny: false,
  gender: 'M',
});

// sprite.url  → "https://play.pokemonshowdown.com/sprites/gen5ani-back/charizard.gif"
// sprite.w    → 96  (width)
// sprite.h    → 96  (height)
```

The `PokemonSprite` component uses this to render the correct sprite for each Pokemon, switching between back (player) and front (opponent) sprites based on the `isBack` prop.

## Data Flow Through @pkmn

### Full Turn Lifecycle

```
  Server (@pkmn/sim)
    │
    │  Protocol text:
    │  |move|p1a: Charizard|Flamethrower|p2a: Venusaur
    │  |-supereffective|p2a: Venusaur
    │  |-damage|p2a: Venusaur|120/270
    │  |move|p2a: Venusaur|Earthquake|p1a: Charizard
    │  |-supereffective|p1a: Charizard
    │  |-damage|p1a: Charizard|90/266
    │  |upkeep
    │  |turn|3
    │  |request|{...new turn choices...}
    │
    ▼
  WebSocket (BATTLE_UPDATE event)
    │
    ▼
  ┌───────────────────────────────────────────────────────┐
  │  dispatch wrapper (use-battle-state.ts)               │
  │                                                       │
  │  1. Protocol.parse(text)         (@pkmn/protocol)     │
  │     → 9 parsed events                                 │
  │                                                       │
  │  2. For each event:                                   │
  │     extractAnimationEvent(args, battle)                │
  │     → reads battle.p2.active[0].hp BEFORE damage      │
  │     → produces { type: 'damage', prevHp: 270, ... }   │
  │                                                       │
  │  3. Queue as PendingProtocolEvent[]                    │
  │     { args, kwArgs, animEvent }                        │
  │                                                       │
  │  4. Bump pendingVersion                               │
  └───────────────────────────────────────────────────────┘
    │
    ▼
  ┌───────────────────────────────────────────────────────┐
  │  processPendingEvents(playAnimation)                  │
  │                                                       │
  │  Event 1: |move| → play move animation                │
  │  Event 2: |-supereffective| → screen shake + flash    │
  │  Event 3: |-damage| → HP drain anim, battle.add()     │
  │           → dispatch re-render (HP bar drops)          │
  │                                                       │
  │  Event 4: |move| → play move animation                │
  │  Event 5: |-supereffective| → screen shake + flash    │
  │  Event 6: |-damage| → HP drain anim, battle.add()     │
  │           → dispatch re-render (HP bar drops)          │
  │                                                       │
  │  Event 7: |upkeep| → battle.add() (no re-render)      │
  │  Event 8: |turn|  → battle.add() (no re-render)       │
  │  Event 9: |request| → battle.add() (no re-render)     │
  │                                                       │
  │  Finally: battle.update(request)                      │
  │           dispatch remaining log lines                │
  │                            (@pkmn/client)              │
  └───────────────────────────────────────────────────────┘
    │
    ▼
  Components read battle.p1, battle.p2, battle.request
  to render updated UI
```

### Battle Initialization

On `BATTLE_START`, events are queued for animated processing (same pipeline as `BATTLE_UPDATE`). The initial `|switch|` events play switch-in animations so the player sees their Pokemon materialize:

```
  BATTLE_START { battleId, initialState }
    │
    ▼
  new Battle(getGenerations())          (@pkmn/client)
  new LogFormatter('p1', battle)        (@pkmn/view)
    │
    ▼
  Protocol.parse(initialState)          (@pkmn/protocol)
    ├── extractAnimationEvent(args, battle) for each event
    └── push to pendingEventsRef queue
    │
    ▼
  _BATTLE_INITIALIZED { battleId, logLines: [] }
  setPendingVersion(v + 1)  → triggers processPendingEvents
```

The `initialState` contains setup protocol: `|player|`, `|teamsize|`, `|gen|`, `|tier|`, initial `|switch|` events, and the first `|request|`.

Only `BATTLE_RESTORED` uses the instant `processBattleProtocol` path (no animations).

### Battle Restoration (Reconnect)

On `BATTLE_RESTORED`, the server sends the complete accumulated protocol since battle start. The same `processBattleProtocol` function replays it all at once:

```
  BATTLE_RESTORED { battleId, currentState }
    │
    ▼
  (Same as BATTLE_START — create fresh Battle, replay all protocol)
    │
    ▼
  _BATTLE_RESTORED { battleId, logLines }
```

This brings the client to the exact same state as if it had been connected the whole time.

## Key Constraints and Gotchas

1. **`battle.update()` overwrites HP** — must only be called after all protocol events in a batch. See [architecture doc](./battle-frontend-architecture.md#the-battleupdate-pitfall).

2. **Battle is mutable** — `battle.add()` mutates in place. The same object reference is used throughout. React doesn't detect changes via `===`, so re-renders must be triggered by dispatching reducer state changes.

3. **Protocol order matters** — events must be processed in the exact order received. The `|request|` event always comes last in a turn's batch. Processing out of order corrupts state.

4. **`extractAnimationEvent` must run before `battle.add()`** — it reads current HP/status to compute deltas (prevHp, prevStatus). After `battle.add()`, those values are gone.

5. **Perspective is determined by the request** — the server assigns `p1` or `p2` to each player. The `request.side.id` tells the client which side they are. This is used for sprite back/front selection, log formatting perspective, and team data access.

6. **`Generations` is expensive** — it indexes the full Pokedex. It's created once (lazily) and shared across all battles.

7. **Ident format** — Pokemon identifiers follow the pattern `"p1a: Charizard"` where `p1`/`p2` is the side, `a`/`b`/`c` is the slot position (singles only uses `a`). These idents are used for sprite registration and animation targeting.

## Related Documentation

- [Battle Frontend Architecture](./battle-frontend-architecture.md) — state management, protocol pipeline, component structure
- [Animation System](./battle-animation-system.md) — animation architecture, move registry, extending animations
- [Battle System (Backend)](./battle-system.md) — server architecture, @pkmn/sim usage
