# Battle Frontend Architecture

## Table of Contents

- [Overview](#overview)
- [Package Boundary](#package-boundary)
  - [Public API Surface](#public-api-surface)
- [State Management](#state-management)
  - [BattleUIState](#battleuistate)
  - [Phase Lifecycle](#phase-lifecycle)
  - [Mutable Battle Object in Ref](#mutable-battle-object-in-ref)
  - [Reducer Design](#reducer-design)
- [Protocol Processing Pipeline](#protocol-processing-pipeline)
  - [Deferred Application Pattern](#deferred-application-pattern)
  - [The Single Processing Loop](#the-single-processing-loop)
  - [The battle.update() Pitfall](#the-battleupdate-pitfall)
  - [Off-Screen and Background Tab Handling](#off-screen-and-background-tab-handling)
- [Context Providers](#context-providers)
  - [BattleSocketProvider](#battlesocketprovider)
  - [AnimationProvider](#animationprovider)
  - [AudioProvider](#audioprovider)
- [Socket Communication](#socket-communication)
  - [Connection Lifecycle](#connection-lifecycle)
  - [Auth Refresh Flow](#auth-refresh-flow)
  - [Event Buffering](#event-buffering)
  - [TOCTOU Guard](#toctou-guard)
- [Component Structure](#component-structure)
  - [Layout Diagram](#layout-diagram)
  - [Battlefield Components](#battlefield-components)
  - [Action Components](#action-components)
  - [Info Components](#info-components)
  - [Lobby Components](#lobby-components)
  - [Global Components](#global-components)
- [Notifications](#notifications)
- [Related Documentation](#related-documentation)

---

## Overview

The battle frontend is a self-contained Nx library (`pokehub-battle-components`) that provides the complete UI for real-time Pokemon battles. It manages WebSocket communication, protocol parsing, animation orchestration, and game state — all driven by the `@pkmn` ecosystem for authentic Pokemon Showdown-compatible gameplay.

The system processes Showdown protocol text from the server, extracts animation cues, plays visual animations, and then applies state changes to the `@pkmn/client` `Battle` instance. This "deferred application" pattern ensures the UI shows the previous state while animations play, creating a natural turn-by-turn visual flow.

## Package Boundary

### Public API Surface

The package exports exactly five symbols — everything else is package-private:

```typescript
// Context & Provider — wraps the battle page
export { BattleSocketProvider, useBattleSocketContext, type BattleSocketContextValue }

// Types
export { type BattleUIState, initialBattleUIState }

// Components
export { BattleLobby }       // queue entry UI
export { BattleContainer }    // full battlefield UI
export { ActiveBattleBar }    // fixed bar for non-battle pages during active battles
```

Consumers mount `<BattleSocketProvider>` at the battle page layout level, then render `<BattleLobby>` or `<BattleContainer>` based on the phase from `useBattleSocketContext()`.

## State Management

### BattleUIState

The central state type tracks everything the UI needs to render:

```typescript
interface BattleUIState {
  phase: 'idle' | 'queued' | 'matched' | 'battle' | 'ended';
  queuePosition: number | null;
  battleId: string | null;
  opponent: { id: string; name: string } | null;
  battle: Battle | null;             // @pkmn/client — mutable, held in ref
  logFormatter: LogFormatter | null;  // @pkmn/view
  turnTimer: { totalSeconds: number; startedAt: number } | null;
  pendingChoice: string | null;
  turnProcessing: boolean;           // true while processPendingEvents is playing animations
  opponentDisconnected: boolean;
  disconnectTimeout: number | null;
  winner: string | null;
  endReason: BattleEndReason | null;
  canSaveReplay: boolean;
  replaySaved: boolean;
  error: { code: string; message: string } | null;
  logEntries: string[];              // formatted HTML from LogFormatter
}
```

### Phase Lifecycle

```
                 JOIN_QUEUE          MATCH_FOUND         BATTLE_START
  ┌──────┐     ┌──────────┐       ┌───────────┐       ┌──────────┐
  │ idle │────▶│  queued   │──────▶│  matched  │──────▶│  battle  │
  └──────┘     └──────────┘       └───────────┘       └──────────┘
     ▲           │     ▲               │                    │
     │           │     │               │                    │
     │     LEAVE_QUEUE │       MATCH_CANCELLED         BATTLE_END
     │           │     │               │                    │
     │           ▼     │               ▼                    ▼
     │        (idle)   └──────── (queued)             ┌──────────┐
     │                                                │  ended   │
     │                                                └──────────┘
     │                                                      │
     └──────────────────── RESET ◀──────────────────────────┘
```

| Phase | Trigger | UI |
|-------|---------|-----|
| `idle` | Initial / reset | Nothing battle-related shown |
| `queued` | `QUEUE_JOINED` | Queue position display, cancel button |
| `matched` | `MATCH_FOUND` | Match acceptance UI |
| `battle` | `BATTLE_START` / `BATTLE_RESTORED` | Full battlefield |
| `ended` | `BATTLE_END` | Victory/defeat overlay, save replay option |

### Mutable Battle Object in Ref

The `@pkmn/client` `Battle` instance is mutable — calling `battle.add(args, kwArgs)` mutates Pokemon HP, status, active slots, etc. in place. Storing it in `useState` would cause full re-renders on every mutation and wouldn't detect changes (same object reference).

Instead, `Battle` lives in a `useRef`:

```typescript
const battleRef = useRef<Battle | null>(null);
const formatterRef = useRef<LogFormatter | null>(null);
```

The reducer tracks serializable UI-specific values (`phase`, `turnTimer`, `pendingChoice`, `logEntries`, etc.). When the reducer dispatches `_BATTLE_UPDATED`, a `useMemo` combines the reducer state with the current ref values:

```typescript
const state: BattleUIState = useMemo(
  () => ({
    ...reducerState,
    battle: battleRef.current,
    logFormatter: formatterRef.current,
  }),
  [reducerState]
);
```

Components re-render when the reducer state changes. At render time, they read the latest Battle data from the ref — which has already been mutated by `battle.add()` in the processing loop.

### Reducer Design

The reducer is pure — it never touches `Battle` or `LogFormatter`. Protocol processing happens in the dispatch wrapper before events reach the reducer.

Three event types are intercepted by the dispatch wrapper and converted to internal events:

```
  Server Event         Dispatch Wrapper                    Internal Event
 ┌──────────────┐    ┌──────────────────────┐    ┌──────────────────────────┐
 │ BATTLE_START │───▶│ Create Battle,       │───▶│ _BATTLE_INITIALIZED      │
 │              │    │ process protocol     │    │ { battleId, logLines }   │
 └──────────────┘    └──────────────────────┘    └──────────────────────────┘

 ┌──────────────┐    ┌──────────────────────┐
 │BATTLE_UPDATE │───▶│ Parse protocol,      │───▶ (queued in pendingEventsRef,
 │              │    │ extract anim events  │     processed later by
 └──────────────┘    └──────────────────────┘     processPendingEvents)

 ┌──────────────┐    ┌──────────────────────┐    ┌──────────────────────────┐
 │BATTLE_RESTORED───▶│ Create Battle,       │───▶│ _BATTLE_RESTORED         │
 │              │    │ process full state   │    │ { battleId, logLines }   │
 └──────────────┘    └──────────────────────┘    └──────────────────────────┘
```

All other server events and local UI events pass through to the reducer directly.

## Protocol Processing Pipeline

### Deferred Application Pattern

When a `BATTLE_UPDATE` arrives with new protocol text, the system does NOT immediately mutate the `Battle` instance. Instead:

```
  BATTLE_UPDATE arrives (protocol text from server)
          │
          ▼
  ┌─────────────────────────────────────────────┐
  │  1. Protocol.parse(text)                    │
  │     yields { args, kwArgs } pairs           │
  │                                             │
  │  2. For each parsed event:                  │
  │     extractAnimationEvent(args, battle)     │
  │     ─── reads CURRENT hp/state (pre-damage) │
  │     ─── produces AnimationEvent | null      │
  │                                             │
  │  3. Append PendingProtocolEvent[] to queue   │
  │     { args, kwArgs, animEvent }             │
  │                                             │
  │  4. Bump pendingVersion (triggers re-render) │
  └─────────────────────────────────────────────┘
          │
          ▼
  useEffect in BattleContainerInner detects pendingVersion change
          │
          ▼
  processPendingEvents(playAnimation)
```

This separation is critical: animation events must be extracted **before** `battle.add()` mutates the state, so they can capture "before" values like `prevHp`.

### The Single Processing Loop

`processPendingEvents(playAnimation?)` is the **only place** protocol events are consumed. It processes each event sequentially in a single `while` loop. All intermediate dispatches set `turnProcessing: true` (hides the action panel). The final dispatch sets `turnProcessing: false` so the action panel reappears.

Events are processed with different log/animation timing depending on their type:

```
  processPendingEvents(playAnimation?)
          │
          ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  while (pending.length > 0) {                                │
  │    event = pending.shift()                                   │
  │                                                              │
  │    ┌── Move (action starter)?                                │
  │    │   Log appears FIRST → dispatch(turnProcessing: true)    │
  │    │   Wait LOG_READ (1s) for player to read                 │
  │    │   Play move animation                                   │
  │    │   battle.add()                                          │
  │    │                                                         │
  │    ├── Switch / drag?                                        │
  │    │   Log appears FIRST → dispatch(turnProcessing: true)    │
  │    │   Wait LOG_READ                                         │
  │    │   Animate old Pokemon out (sprite exists before add)    │
  │    │   battle.add() → dispatch (old sprite unmounts,         │
  │    │                            new sprite mounts)           │
  │    │   Animate new Pokemon in (sprite exists after add)      │
  │    │                                                         │
  │    └── Consequence (damage, faint, boost, status, etc.)?     │
  │        Play animation FIRST (e.g. shake, flash)              │
  │        battle.add() → dispatch (HP bar drops, status shows)  │
  │        Wait LOG_READ                                         │
  │        Log appears AFTER state change                        │
  │                                                              │
  │    ┌── Is |request| event?                                   │
  │    │   YES → formatter.perspective = request.side.id         │
  │    └── NO  → skip                                            │
  │  }                                                           │
  │                                                              │
  │  finally {                                                   │
  │    battle.update(request)  ◀── sync request data             │
  │    dispatch(turnProcessing: false) ◀── action panel returns  │
  │  }                                                           │
  └──────────────────────────────────────────────────────────────┘
```

**State-changing events** that trigger mid-loop re-renders:
`-damage`, `-heal`, `faint`, `switch`, `drag`, `-boost`, `-unboost`, `-status`, `-curestatus`, `-weather`, `-fieldstart`, `-fieldend`, `-sidestart`, `-sideend`

Non-state-changing events (`|request|`, `|upkeep|`, `|turn|`) are accumulated and dispatched in the final step. This keeps the render count reasonable while still showing damage/faint/switch updates between animations.

### The battle.update() Pitfall

A critical design constraint: **`battle.update(request)` must only be called after ALL protocol events have been processed.**

The `@pkmn/client` `Battle.update()` method overwrites `pokemon.hp` from the request data. During a turn's protocol sequence, the `|request|` event (containing the new turn's request) arrives **after** damage/faint events. If `battle.update()` is called during an intermediate dispatch (e.g., after a `-damage` event), it reads the **previous** turn's request and resets HP to pre-damage values — undoing the `battle.add()` mutation.

```
  Turn protocol sequence (simplified):
  ──────────────────────────────────────────
  |move|p1a: Charizard|Flamethrower|p2a: Venusaur
  |-damage|p2a: Venusaur|120/270         ◀── battle.add() sets hp=120
  |move|p2a: Venusaur|Earthquake|p1a: Charizard
  |-supereffective|p1a: Charizard
  |-damage|p1a: Charizard|90/266         ◀── battle.add() sets hp=90
  |upkeep
  |turn|3
  |request|{"side":{"pokemon":[{"hp":"90/266",...}]}}   ◀── NEW request

  ❌ If battle.update(old_request) called after first -damage:
     overwrites hp back to pre-damage value from PREVIOUS turn

  ✅ battle.update(request) called in finally block:
     reads the NEW |request| event, hp values match
```

### Deferred BATTLE_END

`BATTLE_END` can arrive from the server while animations are still processing (e.g., the final faint animation is playing). Applying it immediately would show the victory/defeat overlay before the player sees the knockout.

The dispatch wrapper defers the end event using `deferredEndRef`:

```
  BATTLE_END arrives
      │
      ├── processingRef.current === true OR pending.length > 0?
      │   YES → stash in deferredEndRef (do nothing now)
      │   NO  → dispatch immediately (phase → 'ended')
      │
      ...animations finish...
      │
  processEvents finally block:
      │
      ├── deferredEndRef.current !== null?
      │   YES → dispatch(deferredEndRef.current), clear ref
      └── NO  → (nothing to flush)
```

This ensures the end overlay appears only after all animations have completed and the final state is visible.

### Reconnection and BATTLE_RESTORED

When a player reconnects (page refresh, network drop), the server sends `BATTLE_RESTORED` instead of replaying `BATTLE_START` + all `BATTLE_UPDATE` events. This prevents the client from replaying every animation from the start of the battle.

```
  Player disconnects → reconnects
      │
      ▼
  Server: handleConnection / handleRejoin
      │
      ├── Sends BATTLE_RESTORED (not BATTLE_START)
      │   { protocol: <full battle state>, moveAnimConfigs: {...} }
      │
      ▼
  Client: dispatch(BATTLE_RESTORED)
      │
      ├── Creates fresh Battle + LogFormatter
      ├── Calls processBattleProtocol() — applies ALL events instantly
      │   (no animations, no delays — just battle.add() in a loop)
      ├── Dispatches _BATTLE_RESTORED → phase: 'battle'
      └── Player sees current battle state immediately
```

`processBattleProtocol()` iterates `Protocol.parse(text)`, calls `formatter.formatHTML()` and `battle.add()` for each event, then calls `battle.update(battle.request)` at the end. Log entries are collected and displayed immediately.

### Off-Screen and Background Tab Handling

When the browser tab is hidden or the arena component is unmounted:

```
  Tab hidden / component unmounted
          │
          ▼
  AnimationProvider sets isMounted = false
          │
          ▼
  BattleContainerInner calls:
    processPendingEvents(undefined)   ◀── no playAnimation
          │
          ▼
  All protocol events processed immediately
  (battle.add() called, state updates dispatched)
  No animations play, no backlog accumulates
          │
          ▼
  User returns → sees current state instantly
```

The `isMounted` flag is driven by `document.visibilitychange` and component lifecycle.

## Context Providers

### BattleSocketProvider

The outermost context, mounted at the battle page layout. Composes three hooks:

```
  BattleSocketProvider
  ├── useBattleState()          → [state, dispatch, processPendingEvents,
  │                                 pendingVersion, skipAnimations]
  ├── useBattleSocket()         → { isConnected, emit }
  └── useBattleNotifications()  → (side effects only)
```

Exposes action methods that emit typed `ClientBattleEvent` messages and optimistically update local state:

| Method | Socket Event | Local Effect |
|--------|-------------|--------------|
| `joinQueue(format, teamId)` | `JOIN_QUEUE` | — |
| `leaveQueue()` | `LEAVE_QUEUE` | — |
| `submitMove(battleId, choice)` | `MOVE` | dispatches `CHOICE_SUBMITTED` |
| `cancelChoice()` | `CANCEL_CHOICE` | dispatches `CANCEL_CHOICE` |
| `forfeit(battleId)` | `FORFEIT` | — |
| `rejoin(battleId)` | `REJOIN` | — |
| `saveReplay(battleId)` | `SAVE_REPLAY` | — |
| `requestQueueCounts()` | `GET_QUEUE_COUNTS` | — |

Additionally exposes `queueCounts: Record<string, number>` — a reactive map of format → player count, updated via `QUEUE_COUNTS` server events (intercepted before the battle state reducer, same as `SERVER_STATUS`).

### AnimationProvider

Mounted inside `BattleContainer`, wrapping the arena. Manages:

```
  AnimationProvider
  ├── Sprite registry (Map<string, SpriteHandle>)
  │   └── registerSprite / unregisterSprite
  │
  ├── Visual state
  │   ├── effects: EffectSpriteConfig[]   (projectile sprites)
  │   ├── popups: PopupConfig[]           (damage numbers)
  │   ├── flashColor: string | null       (flash overlay)
  │   └── shakeOffset: { x, y }          (screen shake)
  │
  ├── AnimationScene (stable ref-delegated object)
  │   ├── getSprite(ident)
  │   ├── showEffect(config) / removeEffect(id)
  │   ├── showPopup(config)
  │   ├── shakeScreen(intensity, duration)
  │   ├── flashOverlay(color, duration)
  │   └── delay(ms)
  │
  └── isMounted (visibility tracking)
```

The **stable scene pattern** avoids stale closure issues. A `sceneRef` always holds the latest closures, and a `stableScene` object (created once via `useRef().current`) delegates all calls to `sceneRef.current`:

```typescript
sceneRef.current = { getSprite, showEffect, removeEffect, ... };

const stableScene = useRef<AnimationScene>({
  getSprite: (...args) => sceneRef.current!.getSprite(...args),
  showEffect: (...args) => sceneRef.current!.showEffect(...args),
  // ...
}).current;
```

Animation functions receive `stableScene` and always invoke the latest implementations, regardless of when they were captured.

### AudioProvider

Mounted inside `BattleContainer` alongside `AnimationProvider`. Manages battle audio (BGM, SFX, cries) via the Web Audio API.

```
  AudioProvider
  ├── BattleAudioManager (singleton, useRef)
  │   ├── AudioContext + gain chain (master/bgm/sfx)
  │   └── AudioBuffer cache (Map<string, AudioBuffer>)
  │
  ├── Reactive state mirrors (isMuted, volumes, isUnlocked)
  │
  └── useAudio() hook → { audio, setMasterVolume, toggleMute, ... }
```

The `audio` instance is passed to `playAnimationEvent()` so animation handlers can play SFX concurrently with visuals. See [Battle Audio System](./battle-audio-system.md) for full details.

## Socket Communication

### Connection Lifecycle

`useBattleSocket` creates a single Socket.io client on mount with `autoConnect: false`. The socket targets the `/battle` namespace and uses a callback-form `auth` option so the token is always read fresh from a ref:

```
  Mount                    Token available           Server event
    │                           │                         │
    ▼                           ▼                         ▼
  Create socket          socket.connect()           onEvent(event)
  (autoConnect: false)   (auth callback reads       → dispatch(event)
                          tokenRef.current)
```

### Auth Refresh Flow

```
  Server: token expired
    │
    ▼
  disconnect(reason: "io server disconnect")
    │
    ▼
  onAuthError() → parent calls getAuthSession()
    │
    ▼
  New accessToken prop flows down
    │
    ▼
  useEffect detects change → socket.connect()
    │
    ▼
  auth callback reads fresh token from tokenRef
```

No socket reconstruction needed — the same socket instance reconnects with the new token.

### Event Buffering

Events emitted while disconnected are stored in `pendingEventsRef` and flushed on reconnect:

```typescript
socket.on('connect', () => {
  pendingEventsRef.current.forEach((e) => socket.emit(BATTLE_EVENT, e));
  pendingEventsRef.current = [];
});
```

### TOCTOU Guard

A race condition exists when the user leaves the queue: `LEAVE_QUEUE` may not reach the server before it commits a match. The `onEvent` callback auto-declines:

```
  User clicks "Leave Queue"          Server commits match
        │                                   │
        ▼                                   ▼
  emit(LEAVE_QUEUE) ─────────────▶   MATCH_FOUND arrives
                                         │
                                         ▼
                              state.phase === 'idle'?
                              YES → auto emit(DECLINE_MATCH)
                                    (don't block opponent)
```

## Component Structure

### Layout Diagram

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │  BattleHeader  [gen9ou]  Turn 5  ⏱ 1:42   [Forfeit]               │
  ├────────────┬─────────────────────────────────────┬───────────────────┤
  │            │                                     │                  │
  │  Player    │          Arena (motion.div)          │  Opponent        │
  │  Team      │  ┌──────────────────────────────┐   │  Team            │
  │  Panel     │  │  WeatherBar  [☀ Sun]         │   │  Panel           │
  │            │  │                               │   │                  │
  │  Charizard │  │        ┌──────────┐          │   │  ??? (Pokeball)  │
  │  ████████  │  │        │ Opponent │ HP █████ │   │                  │
  │  Blastoise │  │        │  Sprite  │ Venusaur │   │  Venusaur        │
  │  ████████  │  │        └──────────┘          │   │  ████░░░░        │
  │  Venusaur  │  │  [Effect Sprites]            │   │                  │
  │  ████████  │  │  [Damage Popups]             │   │  ???             │
  │            │  │                               │   │                  │
  │            │  │  ┌──────────┐                │   │                  │
  │            │  │  │  Player  │ HP ████████    │   │                  │
  │            │  │  │  Sprite  │ Charizard      │   │ ┌──────────────┐ │
  │            │  │  └──────────┘                │   │ │  Battle Log  │ │
  │            │  │         SideConditions       │   │ │  ...         │ │
  │            │  └──────────────────────────────┘   │ │  Charizard   │ │
  │            │                                     │ │  used Flame- │ │
  │            │  ┌──────────────────────────────┐   │ │  thrower!    │ │
  │            │  │  ActionPanel                 │   │ │  ...         │ │
  │            │  │  [Flamethrower] [Air Slash]  │   │ │              │ │
  │            │  │  [Earthquake]  [Roost]       │   │ │              │ │
  │            │  │          [Switch Tab]        │   │ └──────────────┘ │
  │            │  └──────────────────────────────┘   │                  │
  └────────────┴─────────────────────────────────────┴───────────────────┘
```

On mobile, team panels collapse into a 2-column grid below the action panel.

### Battlefield Components

| Component | File | Purpose |
|-----------|------|---------|
| `BattlefieldBg` | `battlefield-bg.tsx` | Animated CSS gradients for weather/terrain backgrounds |
| `PokemonSide` | `pokemon-side.tsx` | Composite: nameplate + sprite + HP + stat stages + volatiles |
| `PokemonSprite` | `pokemon-sprite.tsx` | `motion.div`-wrapped sprite image; registers `SpriteHandle` for animations |
| `HPBar` | `hp-bar.tsx` | Color-zoned health bar with CSS `transition-all duration-700` for smooth drain |
| `StatStages` | `stat-stages.tsx` | Displays active stat boosts/drops as delta chips |
| `StatusBadge` | `status-badge.tsx` | Colored abbreviation pill (BRN, PAR, PSN, etc.) |
| `VolatileBadges` | `volatile-badges.tsx` | Badges for volatile conditions (Confusion, Substitute, etc.) |
| `EffectLayer` | `effect-sprite.tsx` | Renders temporary `motion.img` sprites (projectiles, particles) |
| `PopupLayer` | `damage-popup.tsx` | Floating text overlays positioned relative to sprite idents |
| `WeatherBar` | `field-effects.tsx` | Top-edge badges for weather, terrain, pseudo-weather |
| `SideConditions` | `field-effects.tsx` | Entry hazard and screen badges per side |
| `TeamPanel` | `team-panel.tsx` | Team roster — full data for player, revealed-only for opponent |
| `AudioControls` | `audio-controls.tsx` | Volume popover: mute toggle + master/BGM/SFX sliders |

### Action Components

| Component | File | Purpose |
|-----------|------|---------|
| `ActionPanel` | `action-panel.tsx` | Routes to move/switch/team panels based on `request.requestType` |
| `MovePanel` | `move-panel.tsx` | Grid of 4 move buttons with optional mechanic suffix |
| `MoveButton` | `move-button.tsx` | Type-colored move button |
| `MoveTooltip` | `move-tooltip.tsx` | Hover tooltip: PP, type, power, accuracy |
| `SwitchPanel` | `switch-panel.tsx` | Lists benched non-fainted Pokemon for switching |
| `MechanicToggle` | `mechanic-toggle.tsx` | Mega / Z-Move / Dynamax / Tera toggle |

The `ActionPanel` renders one of four states depending on `battle.request.requestType`:
- `wait` / no request — spinner
- Pending choice — "Waiting..." + chosen move label + "Change Move" button
- `team` — Pokemon grid for lead selection (team preview)
- `switch` — switch panel only (forced switch after faint)
- `move` — tabs (Moves / Switch) with optional mechanic toggles; detects `trapped` to disable the switch tab

### Info Components

| Component | File | Purpose |
|-----------|------|---------|
| `BattleHeader` | `battle-header.tsx` | Format badge, turn counter, timer, forfeit with confirmation dialog |
| `BattleLog` | `battle-log.tsx` | Auto-scrolling log of formatted HTML from `@pkmn/view` `LogFormatter` |
| `TurnTimer` | `turn-timer.tsx` | Countdown clock from `totalSeconds` + `startedAt` |
| `BattleEndOverlay` | `battle-end-overlay.tsx` | Victory/defeat/draw screen with save replay action |

### Lobby Components

| Component | File | Purpose |
|-----------|------|---------|
| `BattleLobby` | `battle-lobby.tsx` | Queue entry, format/team selection, queue counts, match-found transition |
| `QueueCounts` | `queue-counts.tsx` | Collapsible display of player counts per format |
| `QueueStatus` | `queue-status.tsx` | Animated queue position indicator |
| `TeamSelector` | `team-selector.tsx` | Team dropdown before queuing |

The lobby renders phase-dependent UI:
- **`idle`** — queue counts + team selection card + "Find Battle" button
- **`queued`** — `QueueStatus` with cancel button
- **`matched` / `battle`** — transition card: pulsing swords icon, "Match Found!" + opponent name, spinner + "Waiting for battle to start..." (handles the gap between match acceptance and `BATTLE_START` arrival)

#### Queue Counts

The `QueueCounts` component shows how many players are searching in each battle format:

- **Collapsed (default)**: Summary line — "5 players searching across 3 formats" with a chevron toggle
- **Expanded**: Per-format breakdown with format display name and player count badge
- **Empty**: "No players currently in queue"

Data flow:
1. `BattleLobby` mounts → emits `GET_QUEUE_COUNTS` via `requestQueueCounts()` when connected
2. Server responds with `QUEUE_COUNTS` event containing `counts: Record<string, number>`
3. `BattleSocketProvider` intercepts the event (same pattern as `SERVER_STATUS`) and updates `queueCounts` state
4. Real-time updates: server broadcasts `QUEUE_COUNTS` to all connected clients after any queue join, leave, disconnect, or match found

Format IDs (e.g., `gen9ou`) are parsed via regex and converted to display names using `getFormatDisplayName()` (e.g., "[Gen 9] OU").

### Global Components

| Component | File | Purpose |
|-----------|------|---------|
| `ActiveBattleBar` | `active-battle-bar.tsx` | Fixed bottom bar on non-battle pages; shows turn/timer, "Return to Battle" |

## Notifications

`useBattleNotifications` provides toast notifications (via Sonner) for battle events, split into two categories:

**Global (any page):**
- `ERROR` — error/warning toast based on `recoverable`
- `MATCH_CANCELLED` — info toast
- `BATTLE_UPDATE` with `autoMove` — warning that a random move was made on timeout
- `REPLAY_SAVED` — success toast

**Away-page only (not on `/battle`):**
- New turn — "It's your turn!" with navigation action
- `TURN_WARNING` — timer countdown with navigation action
- `OPPONENT_DISCONNECTED` / `OPPONENT_RECONNECTED` — status toasts
- `BATTLE_END` — result with "View results" action
- `BATTLE_RESTORED` — "You have an active battle" with rejoin action

## Related Documentation

- [Battle Audio System](./battle-audio-system.md) — audio architecture, CORS proxy, volume controls, asset pipeline
- [Battle System (Backend)](./battle-system.md) — server architecture, Redis model, matchmaking flows
- [@pkmn Integration Guide](./battle-pkmn-integration.md) — how @pkmn packages power the frontend
- [Animation System](./battle-animation-system.md) — animation architecture, move registry, extending animations
