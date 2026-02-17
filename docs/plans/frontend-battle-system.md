# Frontend Battle System Implementation

## Context

The backend battle infrastructure is complete (WebSocket gateway, matchmaking, battle manager, turn timer, persistence — see `docs/features/battle-system.md`). The frontend needs to connect to it and provide the battle UI. The roadmap (`docs/plans/feature-roadmap.md`) has PoC wireframes, component hierarchy, and state management designs for the battle feature.

**Current state:** No `/battle` page exists. The home page shows "Coming Soon" for Battle. Navigation already links to `/battle` for authenticated users. `socket.io-client@^4.8.3` is installed but unused.

**Critical bug:** The backend currently reads only from `streams.omniscient` and broadcasts the same data to both players. This means both players see ALL hidden information (opponent's exact HP, unrevealed team members, etc.). The `streams.p1` and `streams.p2` perspective streams are created by `BattleStreams.getPlayerStreams()` but never read. This must be fixed before the frontend can work correctly.

---

## Phase 0: Backend Per-Player Stream Fix (DONE)

The `@pkmn/sim` `BattleStreams.getPlayerStreams()` creates three output streams:

- `streams.omniscient` — sees everything (full team details, exact HP, etc.)
- `streams.p1` — sees only what player 1 should see (opponent info redacted)
- `streams.p2` — sees only what player 2 should see (opponent info redacted)

Commands (`>start`, `>p1 move ...`, `>p2 move ...`) are written to `streams.omniscient`. Output is read from the perspective streams.

### 0.1 Update `BattleInstance` type

**File:** `apps/pokehub-api/src/battle/services/battle-manager/battle-manager.service.ts` (line ~714)

Add per-player state fields:

```typescript
interface BattleInstance {
  config: BattleConfig;
  stream: BattleStreams.BattleStream;
  streams: ReturnType<typeof BattleStreams.getPlayerStreams>;
  currentState: string; // Keep: omniscient (for win/tie detection + replay log)
  p1State: string; // NEW: p1 perspective output
  p2State: string; // NEW: p2 perspective output
  ended: boolean;
  winnerId: string | null;
}
```

### 0.2 Update `createBattleInstance()`

**File:** `apps/pokehub-api/src/battle/services/battle-manager/battle-manager.service.ts` (line ~402)

Keep the existing omniscient reader (needed for win/tie detection in `executeTurn()` and for replay log storage). Add two additional readers for the player perspective streams:

```typescript
// Keep existing omniscient reader
let currentState = '';
void (async () => {
  for await (const chunk of streams.omniscient) {
    currentState += chunk + '\n';
  }
})();

// NEW: Read per-player perspective streams
let p1State = '';
void (async () => {
  for await (const chunk of streams.p1) {
    p1State += chunk + '\n';
  }
})();

let p2State = '';
void (async () => {
  for await (const chunk of streams.p2) {
    p2State += chunk + '\n';
  }
})();
```

Return object includes all three:

```typescript
return {
  config,
  stream,
  streams,
  get currentState() {
    return currentState;
  },
  get p1State() {
    return p1State;
  },
  get p2State() {
    return p2State;
  },
  ended: false,
  winnerId: null,
};
```

### 0.3 Update `ActiveBattle` interface

**File:** `apps/pokehub-api/src/battle/services/battle-manager/battle-manager.service.interface.ts`

```typescript
export interface ActiveBattle {
  id: string;
  config: BattleConfig;
  currentState: string; // omniscient (for internal use / replay)
  p1State: string; // p1 perspective
  p2State: string; // p2 perspective
}
```

### 0.4 Update `BattleStateUpdateMessage`

**File:** `packages/backend/pokehub-redis/src/lib/redis.types.ts` (line ~242)

Change from single `data` to per-player data, and include player IDs (needed for cross-server scenarios where the receiving gateway doesn't host the battle):

```typescript
export interface BattleStateUpdateMessage {
  type: 'state';
  p1Id: string;
  p2Id: string;
  p1Data: string;
  p2Data: string;
}
```

### 0.5 Update `executeTurn()`

**File:** `apps/pokehub-api/src/battle/services/battle-manager/battle-manager.service.ts` (line ~467)

Publish per-player data instead of omniscient:

```typescript
await this.redis.publishBattleUpdate(battleId, {
  type: 'state',
  p1Id: instance.config.player1.id,
  p2Id: instance.config.player2.id,
  p1Data: instance.p1State,
  p2Data: instance.p2State,
});

// Keep using instance.currentState (omniscient) for win/tie detection
const newState = instance.currentState;
const winMatch = newState.match(/\|win\|(.+)/);
```

### 0.6 Update Gateway: `handleBattleUpdateMessage()`

**File:** `apps/pokehub-api/src/battle/battle.gateway.ts` (line ~170)

For `case 'state'`, replace room broadcast with per-player targeted emit:

```typescript
case 'state': {
  const p1SocketId = this.userToSocket.get(message.p1Id);
  const p2SocketId = this.userToSocket.get(message.p2Id);

  if (p1SocketId) {
    this.server.to(p1SocketId).emit(BATTLE_EVENT, {
      type: 'BATTLE_UPDATE', battleId, data: message.p1Data,
    } satisfies ServerBattleEvent);
  }
  if (p2SocketId) {
    this.server.to(p2SocketId).emit(BATTLE_EVENT, {
      type: 'BATTLE_UPDATE', battleId, data: message.p2Data,
    } satisfies ServerBattleEvent);
  }
  break;
}
```

### 0.7 Update Gateway: `tryFindMatch()`

**File:** `apps/pokehub-api/src/battle/battle.gateway.ts` (line ~822)

Send each player their own perspective on `BATTLE_START`:

```typescript
if (socket1) {
  // ...
  sockets1[0].emit(BATTLE_EVENT, {
    type: 'BATTLE_START',
    battleId,
    initialState: battle.p1State, // was: battle.currentState
  } satisfies ServerBattleEvent);
}
if (socket2) {
  // ...
  sockets2[0].emit(BATTLE_EVENT, {
    type: 'BATTLE_START',
    battleId,
    initialState: battle.p2State, // was: battle.currentState
  } satisfies ServerBattleEvent);
}
```

### 0.8 Update Gateway: `handleRejoin()` and `handleConnection()`

**File:** `apps/pokehub-api/src/battle/battle.gateway.ts`

In `handleRejoin()` (line ~644), determine player slot and send correct perspective:

```typescript
const slot = battle.config.player1.id === userId ? 'p1' : 'p2';
client.emit(BATTLE_EVENT, {
  type: 'BATTLE_START',
  battleId: battle.id,
  initialState: slot === 'p1' ? battle.p1State : battle.p2State,
} satisfies ServerBattleEvent);
```

In `handleConnection()` (line ~280), same for `BATTLE_RESTORED`:

```typescript
const config = battle.config;
const slot = config.player1.id === userId ? 'p1' : 'p2';
client.emit(BATTLE_EVENT, {
  type: 'BATTLE_RESTORED',
  battleId: activeBattleId,
  currentState: slot === 'p1' ? battle.p1State : battle.p2State,
});
```

### 0.9 Summary of Phase 0 changes

| File                                  | Change                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `battle-manager.service.ts`           | Add p1/p2 stream readers in `createBattleInstance()`, update `BattleInstance` type, update `executeTurn()` to publish per-player data |
| `battle-manager.service.interface.ts` | Add `p1State`, `p2State` to `ActiveBattle`                                                                                            |
| `redis.types.ts`                      | Change `BattleStateUpdateMessage` from `{ data }` to `{ p1Id, p2Id, p1Data, p2Data }`                                                 |
| `battle.gateway.ts`                   | Send per-player data in `handleBattleUpdateMessage()`, `tryFindMatch()`, `handleRejoin()`, `handleConnection()`                       |

**No changes needed** to server event types (`server-events.ts`) — `BattleStartEvent.initialState`, `BattleUpdateEvent.data`, and `BattleRestoredEvent.currentState` are all per-player fields; the fix is in which data we populate them with.

---

## Architecture Overview

### Provider Placement

`BattleSocketProvider` is mounted at the **app level** inside the `App` component (`apps/pokehub-app/app/(components)/app.tsx`), not inside the `/battle` layout. This ensures:

- The socket connection persists when the user navigates away from `/battle` (e.g., to `/team-builder`) and back.
- Battle state (queue position, active battle, etc.) survives route changes.
- The provider can show toast notifications for battle events regardless of which page the user is on.
- The socket only connects when `accessToken` is truthy, so unauthenticated users incur no overhead.

```
apps/pokehub-app/app/
├── (components)/
│   ├── app.tsx                # Wraps children with BattleSocketProvider
│   └── bootstrapper.tsx       # SessionProvider, QueryProvider, ThemeProvider
├── battle/
│   ├── layout.tsx             # Auth guard only (no provider)
│   ├── page.tsx               # Battle lobby (format/team select, queue)
│   └── [battleId]/
│       └── page.tsx           # Active battle page
└── ...other routes            # Socket stays alive across navigation

packages/frontend/pokehub-battle-components/   # Nx library
└── src/lib/
    ├── hooks/
    │   ├── use-battle-socket.ts       # Socket.io connection lifecycle
    │   ├── use-battle-state.ts        # useReducer for battle state
    │   └── use-battle-notifications.ts # Toast notifications when away from battle
    ├── context/
    │   └── battle-socket.context.tsx   # React context for socket + state + notifications
    ├── components/
    │   ├── lobby/
    │   │   ├── battle-lobby.tsx        # Main lobby component
    │   │   ├── format-selector.tsx     # Format dropdown
    │   │   ├── team-selector.tsx       # Team picker
    │   │   └── queue-status.tsx        # Queue UI with cancel
    │   ├── battlefield/
    │   │   ├── battle-container.tsx    # Main battle layout
    │   │   ├── pokemon-sprite.tsx      # Pokemon sprite display
    │   │   ├── hp-bar.tsx             # Animated HP bar
    │   │   ├── status-badge.tsx       # Status condition badges
    │   │   ├── pokemon-side.tsx       # One side (sprite + HP + status + info)
    │   │   └── field-effects.tsx      # Weather/terrain indicators
    │   ├── actions/
    │   │   ├── action-panel.tsx        # Move/switch panel container
    │   │   ├── move-button.tsx         # Single move button with type color
    │   │   ├── move-panel.tsx          # 4 move buttons grid
    │   │   ├── switch-panel.tsx        # Team member list for switching
    │   │   └── team-member.tsx         # Single team member in switch panel
    │   ├── info/
    │   │   ├── battle-header.tsx       # Format badge, turn counter, timer
    │   │   ├── turn-timer.tsx          # Countdown timer
    │   │   └── battle-log.tsx          # Scrolling text log
    │   └── end/
    │       └── battle-end-overlay.tsx  # Win/loss screen + replay save
    └── types/
        └── battle-ui.types.ts         # Frontend-specific UI types
```

---

## Phase 1: Frontend Infrastructure & Socket Layer

### 1.1 Install `@pkmn/client`

**Why:** The server sends raw @pkmn/sim protocol text in `BATTLE_START.initialState` and `BATTLE_UPDATE.data`. The `@pkmn/client` package provides a `Battle` class that parses this protocol into structured state (Pokemon HP, moves, status, field conditions, team) — the same parser Pokemon Showdown's own client uses.

```bash
npm install @pkmn/client
```

### 1.2 Create `pokehub-battle-components` Nx library

Generate with Nx:

```bash
nx g @nx/react:library pokehub-battle-components --directory=packages/frontend/pokehub-battle-components --importPath=@pokehub/frontend/pokehub-battle-components --bundler=none --unitTestRunner=jest --style=none
```

### 1.3 Add battle route to router

**File:** `apps/pokehub-app/router.ts`

Add to `privilegedRoutes`:

```typescript
{
  route: '/battle',
  rolesAllowed: ['USER'],
  allowSubRoutes: true,  // For /battle/[battleId]
}
```

### 1.4 Socket hook: `use-battle-socket.ts`

Manages a single long-lived Socket.io connection to the `/battle` namespace. The socket is created once on mount and stays alive across route navigations (since the provider is at the app level).

```typescript
function useBattleSocket(options: {
  accessToken: string | undefined;
  onEvent: (event: ServerBattleEvent) => void;
  onAuthError: () => void;
}): {
  isConnected: boolean;
  emit: (event: ClientBattleEvent) => void; // Typed emissions
};
```

**Socket creation — single `useEffect` (deps: `[]`):**

The socket is created once with `autoConnect: false` (socket is instantiated but does not connect until `socket.connect()` is called — needed because the token may not be available at mount time while the session is loading). The `auth` option uses a **callback function** that reads the latest token from a ref, so every (re)connection attempt uses the freshest token without recreating the socket:

```typescript
const socket = io(`${apiUrl}${BATTLE_NAMESPACE}`, {
  auth: (cb) => cb({ token: tokenRef.current }),
  transports: ['websocket'],
  autoConnect: false,
});
```

If `accessToken` is already available at mount, `socket.connect()` is called immediately inside this effect.

**Token arrival / refresh — second `useEffect` (deps: `[accessToken]`):**

Handles two scenarios:

1. **Token arrives after mount** — session was loading, token was `undefined` at mount time. When the session resolves, `accessToken` becomes truthy, `tokenRef` updates, and `socket.connect()` is called.
2. **Token refreshed after auth failure** — server rejected an expired token (see below), parent refreshed the session, `accessToken` changed. `tokenRef` updates and `socket.connect()` reconnects with the fresh token.

Uses `socket.active` (true when connected or actively reconnecting) to avoid calling `connect()` redundantly.

**Auth failure handling — `disconnect` event:**

The backend validates the token in `handleConnection()`. If invalid, the server calls `client.disconnect()`, which fires a `disconnect` event on the client with reason `"io server disconnect"`. We check the reason to selectively trigger a token refresh:

```typescript
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server rejected us — likely expired token. Trigger refresh.
    onAuthError();
  }
  // 'ping timeout', 'transport close', 'transport error':
  //   socket.io auto-reconnects — auth callback reads latest token from ref.
  // 'io client disconnect':
  //   We initiated disconnect — no action needed.
});
```

**Typed emissions:**

The `emit` function accepts `ClientBattleEvent` (discriminated union from `@pokehub/shared/pokemon-battle-types`). It destructures `{ type, ...payload }` and calls `socket.emit(type, payload)`, matching the gateway's `@SubscribeMessage(type)` handlers.

**Cleanup:** On unmount, the socket is disconnected and all listeners removed.

### 1.5 Battle state reducer: `use-battle-state.ts`

A `useReducer` that processes `ServerBattleEvent` into UI-friendly state.

```typescript
interface BattleUIState {
  phase: 'idle' | 'queued' | 'matched' | 'battle' | 'ended';
  queuePosition: number | null;
  battleId: string | null;
  opponent: { id: string; name: string } | null;

  // @pkmn/client Battle instance (handles protocol parsing)
  battle: Battle | null;

  // Turn state
  turnTimer: { secondsRemaining: number; warning: boolean } | null;
  pendingChoice: boolean; // Has user submitted a choice this turn?

  // Disconnection
  opponentDisconnected: boolean;
  disconnectTimeout: number | null;

  // End state
  winner: string | null;
  endReason: BattleEndReason | null;
  canSaveReplay: boolean;
  replaySaved: boolean;

  // Error
  error: { code: string; message: string } | null;

  // Log
  logEntries: string[];
}
```

**Reducer cases by event type:**

- `QUEUE_JOINED` -> phase='queued', set position
- `QUEUE_LEFT` -> phase='idle', clear queue state
- `MATCH_FOUND` -> phase='matched', set battleId + opponent
- `MATCH_CANCELLED` -> phase='queued' (auto-requeued)
- `BATTLE_START` -> phase='battle', create `@pkmn/client` Battle, feed initialState
- `BATTLE_UPDATE` -> feed data to Battle instance, update log
- `BATTLE_END` -> phase='ended', set winner/reason
- `TURN_WARNING` -> update timer state
- `OPPONENT_DISCONNECTED` -> set disconnected flag + timeout
- `OPPONENT_RECONNECTED` -> clear disconnected flag
- `BATTLE_RESTORED` -> phase='battle', rebuild state (if reconnecting)
- `REPLAY_SAVED` -> set replaySaved=true
- `ERROR` -> set error (clear after display)

### 1.6 Socket context: `battle-socket.context.tsx`

Combines socket hook + state reducer + notifications. Mounted inside `App` (app-level) so it persists across all route navigations.

```typescript
interface BattleSocketContextValue {
  state: BattleUIState;
  isConnected: boolean;
  joinQueue: (format: string, teamId: string) => void;
  leaveQueue: () => void;
  declineMatch: (battleId: string) => void;
  submitMove: (battleId: string, choice: string) => void;
  forfeit: (battleId: string) => void;
  rejoin: (battleId: string) => void;
  saveReplay: (battleId: string) => void;
}
```

Each action method emits the corresponding typed `ClientBattleEvent` on the socket. The `onEvent` callback dispatches to the reducer.

**Auth refresh:** Passes `onAuthError` callback to `useBattleSocket` that calls `getAuthSession()` (re-exported from `next-auth/react`'s `getSession`). This makes a request to `/api/auth/session`, which runs the JWT callback on the server — the callback checks token expiry and refreshes via `GET /auth/access-token` if needed. When the session updates, `accessToken` changes → `tokenRef` updates → socket reconnects with the fresh token.

**DECLINE_MATCH logic:** Track local `isInQueue` flag. If `MATCH_FOUND` arrives when `phase !== 'queued'`, auto-send `DECLINE_MATCH` (per design doc's TOCTOU handling).

### 1.7 Notification hook: `use-battle-notifications.ts`

Shows toast notifications when battle events arrive while the user is **not** on the `/battle` page. Uses `usePathname()` from `next/navigation` to detect the current route.

```typescript
function useBattleNotifications(state: BattleUIState): void;
```

**When notifications fire:** Only when `pathname` does not start with `/battle` AND there is an active battle (`phase === 'battle'` or `phase === 'ended'`).

**Events that trigger notifications:**

| Event                                  | Toast                               | Action                 |
| -------------------------------------- | ----------------------------------- | ---------------------- |
| `BATTLE_UPDATE` with new `\|request\|` | "It's your turn! Make your move."   | "Go to battle" button  |
| `TURN_WARNING`                         | "Turn timer: {seconds}s remaining!" | "Go to battle" button  |
| `OPPONENT_DISCONNECTED`                | "Your opponent disconnected."       | "Go to battle" button  |
| `OPPONENT_RECONNECTED`                 | "Your opponent reconnected."        | (dismiss only)         |
| `BATTLE_END` (win)                     | "Victory! You won the battle."      | "View results" button  |
| `BATTLE_END` (loss/draw)               | "Battle ended — {reason}."          | "View results" button  |
| `BATTLE_RESTORED`                      | "You have an active battle."        | "Rejoin battle" button |

**Action buttons:** Use Sonner's `action` option with `router.push(`/battle/${battleId}`)`.

**Deduplication:** Track last notified turn number to avoid repeated "your turn" toasts for the same turn.

This hook is called inside `BattleSocketProvider`, so notifications work on every page.

---

## Phase 2: Battle Lobby Page

### 2.1 Layout: `apps/pokehub-app/app/battle/layout.tsx`

Server component with auth guard only. The `BattleSocketProvider` lives at the app level (see Architecture Overview), not here.

```typescript
export default async function BattleLayout({ children }) {
  await handleServerAuth();
  return <>{children}</>;
}
```

### 2.2 Lobby page: `apps/pokehub-app/app/battle/page.tsx`

Client component. Uses `useBattleSocketContext()` for state and actions. Shows different UI based on `state.phase`:

- **idle**: Format selector + team selector + "Find Battle" button
- **queued**: Queue status with position + cancel button
- **matched**: "Match found!" transition screen (brief, auto-navigates to battle)

### 2.3 Components

**`format-selector.tsx`**: Reuses the format system from `@pokehub/frontend/dex-data-provider` (`packages/frontend/dex-data-provider/src/lib/api/formats.api.ts`):

- Generation selector (1-9) defaulting to Gen 9
- Format dropdown populated by `getFormatsForGeneration(gen)`, grouped by category via `groupFormatsByCategory()` (Singles, Doubles, VGC, Monotype, National Dex, Other)
- Optional search filter using `searchFormats()` when the list is long
- On queue join, builds the full Showdown format ID with `getShowdownFormatId(gen, formatId)` (e.g., Gen 9 + "ou" -> `"gen9ou"`)
- Same format list and categories already used in the Team Builder

**`team-selector.tsx`**: Fetches user's teams via TanStack Query (`useUserTeams()` from pokehub-team-builder package). Displays as selectable cards/list. Must select a team before queuing.

**`queue-status.tsx`**: Shows "Searching for opponent..." with animated dots/spinner, queue position, and cancel button. Transitions to "Match found!" with opponent name.

**Navigation on match:** When `BATTLE_START` received, use `router.push('/battle/${state.battleId}')` to navigate to the active battle page.

---

## Phase 3: Battle UI

### 3.1 Active battle page: `apps/pokehub-app/app/battle/[battleId]/page.tsx`

Client component. Reads `battleId` from params. If `state.battleId` doesn't match or `state.phase !== 'battle'`, attempts rejoin via `rejoin(battleId)`. Otherwise renders `<BattleContainer />`.

### 3.2 @pkmn/client Integration

The `Battle` instance from `@pkmn/client` is created in the reducer on `BATTLE_START`:

```typescript
import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';

const gens = new Generations(Dex);
const battle = new Battle(gens);
// Feed protocol text
battle.add(initialState);
battle.update();
```

On `BATTLE_UPDATE`, feed additional protocol:

```typescript
battle.add(data);
battle.update();
```

The `battle` object now contains structured state:

- `battle.p1` / `battle.p2` -- Player sides with Pokemon, name, rating
- `battle.p1.pokemon[0]` -- Active Pokemon with HP, status, moves, stats, boosts
- `battle.field` -- Weather, terrain, side conditions
- `battle.turn` -- Current turn number
- `battle.ended` -- Whether battle has ended
- `battle.request` -- Available choices for the current player (moves, switches)

The `battle.request` object is critical -- it tells us what moves/switches are available, which we use to render the ActionPanel.

### 3.3 Component Details

**`battle-container.tsx`** -- Main layout grid:

- Desktop: 2-column (battlefield + action panel on left, battle log on right)
- Mobile: Stacked (battlefield -> battle log snippet -> action panel)
- Contains: BattleHeader, OpponentSide, PlayerSide, ActionPanel, BattleLog
- Shows BattleEndOverlay when phase='ended'

**`pokemon-side.tsx`** -- Renders one player's active Pokemon:

- Props: `pokemon: Pokemon` (from @pkmn/client), `isOpponent: boolean`
- Contains: PokemonSprite, HPBar, StatusBadge, name/level display
- Opponent side: Shows limited info (no exact HP number, only %)
- Player side: Shows full info (exact HP, PP counts)

**`pokemon-sprite.tsx`** -- Shows Pokemon sprite using `@pkmn/img`:

- Uses `Sprites.getPokemon(name, { gen, side })` to get sprite URL
- Opponent sprite faces left/back, player sprite faces right/front
- CSS fade-out animation on faint

**`hp-bar.tsx`** -- Animated health bar:

- Props: `current: number, max: number`
- Color: green (>50%), yellow (25-50%), red (<25%)
- CSS transition on width change: `transition: width 0.5s ease`
- Shows percentage text

**`status-badge.tsx`** -- Shows status condition (BRN, PAR, SLP, FRZ, PSN, TOX):

- Props: `status: string | null`
- Uses Badge component with status-specific colors
- Reuses Pokemon type color palette where applicable

**`move-button.tsx`** -- Single move button:

- Props: `move: { name, type, pp, maxpp, disabled }`, `onSelect: () => void`
- Shows move name, type color background (using `typeColors` from shared-utils), PP counter
- Disabled state when no PP or not player's turn
- `onClick` -> calls `submitMove(battleId, 'move N')`

**`move-panel.tsx`** -- 2x2 grid of MoveButtons:

- Reads available moves from `battle.request.active[0].moves`
- If forced (only 1 choice), auto-select or show disabled state

**`switch-panel.tsx`** -- List of team members for switching:

- Shows all non-active, non-fainted Pokemon
- Each `TeamMember` shows icon, HP preview, status
- `onClick` -> calls `submitMove(battleId, 'switch N')`

**`action-panel.tsx`** -- Container for move/switch selection:

- Tabs/toggle between "Moves" and "Switch"
- Shows "Waiting for opponent..." after submitting choice
- Disabled when `pendingChoice === true`
- Determines available actions from `battle.request`

**`battle-header.tsx`** -- Top bar:

- Format badge (e.g., "Gen 9 OU")
- Turn counter ("Turn 5")
- TurnTimer component
- Forfeit button (with confirmation dialog)

**`turn-timer.tsx`** -- Countdown display:

- Shows seconds remaining
- Turns red/pulses when `warning === true` (under 30s)
- Updates from TURN_WARNING events

**`battle-log.tsx`** -- Scrollable text log:

- Renders protocol text lines as readable messages
- Auto-scrolls to bottom on new entries
- Color-coded by event type (damage in red, heal in green, etc.)

**`battle-end-overlay.tsx`** -- Post-battle screen:

- Overlay/modal on top of battle field
- Shows "Victory!" or "Defeat" with opponent name
- End reason text
- "Save Replay" button (if canSaveReplay and !replaySaved)
- "Find New Battle" button -> navigate to /battle
- "Exit" button -> navigate to home

---

## Phase 4: Navigation Persistence, Notifications & Polish

### 4.1 Navigation away from an active battle

Because `BattleSocketProvider` is at the app level:

- **Socket stays connected.** The user can navigate to `/team-builder`, `/pokedex`, `/settings`, etc. and the WebSocket connection remains alive. All battle events (`BATTLE_UPDATE`, `TURN_WARNING`, `BATTLE_END`, etc.) continue to be received and processed by the reducer.
- **State is preserved.** The `@pkmn/client` `Battle` instance and all UI state (`phase`, `pendingChoice`, `turnTimer`, etc.) live in the context and are not lost on route change.
- **Return to battle.** When the user navigates back to `/battle/[battleId]`, the page reads from the existing context state — no rejoin/reconnect needed. The UI renders the current battle state immediately.

### 4.2 Returning to the battle

The user has multiple ways to navigate back to an active battle:

**A. Persistent battle bar (`active-battle-bar.tsx`)**

A small floating bar rendered at the bottom of every page when `phase === 'battle'` and the user is NOT on `/battle/*`. Mounted inside `BattleSocketProvider` (app-level), uses `usePathname()` to conditionally render.

```
Desktop:
┌──────────────────────────────────────────────────────────────────────────┐
│                        (current page content)                          │
│                                                                        │
│                                                                        │
├──────────────────────────────────────────────────────────────────────────┤
│ ⚔ vs. Ash  │  Turn 5 — Your turn!  │  ⏱ 01:23  │  [ Return to Battle ] │
└──────────────────────────────────────────────────────────────────────────┘

Mobile:
┌────────────────────────────────┐
│     (current page content)     │
│                                │
├────────────────────────────────┤
│ ⚔ vs. Ash — Your turn!  ⏱ 82s│
│       [ Return to Battle ]     │
└────────────────────────────────┘

States:
┌─ Your turn ────────────────────────────────────────────────────────────┐
│ ⚔ vs. Ash  │  Turn 5 — Your turn!  │  ⏱ 01:23  │  [ Return to Battle ]│
└────────────────────────────────────────────────────────────────────────┘

┌─ Waiting ──────────────────────────────────────────────────────────────┐
│ ⚔ vs. Ash  │  Turn 5 — Waiting for opponent...  │  [ Return to Battle ]│
└────────────────────────────────────────────────────────────────────────┘

┌─ Timer warning (bar pulses/red accent) ────────────────────────────────┐
│ ⚔ vs. Ash  │  Turn 5 — Your turn!  │  ⏱ 00:15  │  [ Return to Battle ]│
└────────────────────────────────────────────────────────────────────────┘

┌─ Opponent disconnected ───────────────────────────────────────────────┐
│ ⚔ vs. Ash  │  Opponent disconnected (45s)       │  [ Return to Battle ]│
└────────────────────────────────────────────────────────────────────────┘

┌─ Battle ended ────────────────────────────────────────────────────────┐
│ ⚔ vs. Ash  │  Victory!                          │  [ View Results ]    │
└────────────────────────────────────────────────────────────────────────┘
```

Styling:

- Fixed position at the bottom of the viewport, full width
- Semi-transparent background with backdrop blur (consistent with app's toast styling)
- Border-top accent color: default = muted, your turn = primary, timer warning = destructive
- Dismissible via `X` button (but reappears on next event if still in battle)

**B. Nav link indicator**

The "Battle" link in `AppNav` shows a visual indicator (pulsing dot or badge) when there's an active battle. The context exposes `state.phase` and `state.battleId`, so `AppNav` (or a small wrapper) can read from the battle context to conditionally render the indicator. Clicking the Battle nav link when there's an active battle navigates to `/battle/[battleId]` instead of the lobby.

**C. Toast notification actions**

Each toast notification (see 4.3) includes a "Go to battle" / "Rejoin" action button that navigates to the battle page. These are reactive (shown when events arrive) rather than persistent.

### 4.3 Toast notifications when away from battle

The `useBattleNotifications` hook (see 1.7) fires Sonner toast notifications when battle events arrive while the user is NOT on `/battle/*`. Each toast includes an action button to navigate back. Key notifications:

- **"It's your turn!"** — when `BATTLE_UPDATE` contains a new `|request|` (opponent made their move, waiting on user)
- **Turn timer warning** — when `TURN_WARNING` arrives with low time remaining
- **Opponent disconnected / reconnected** — status updates
- **Battle ended** — win/loss/draw result with "View results" action

### 4.4 Reconnection handling (page refresh / new session)

- On page load, if user has an active battle, the backend sends `BATTLE_RESTORED` on socket connect. The reducer transitions to `phase='battle'` with the restored state.
- If user is NOT on `/battle/*`, the active battle bar appears and a toast notification shows: "You have an active battle" with a "Rejoin" button.
- If user IS on `/battle/[battleId]`, the page renders from the restored state.
- Battle page checks if `state.battleId` matches the URL param and calls `rejoin()` if the state is stale.

### 4.5 Opponent disconnect UI

- Overlay message: "Opponent disconnected. Waiting {timeout}s..."
- Countdown timer for disconnect timeout
- Clears when OPPONENT_RECONNECTED received

### 4.6 Error handling

- Toast notifications for recoverable errors (using Sonner via shared-ui-components)
- Redirect to lobby for non-recoverable errors
- Network disconnect detection (socket.io `disconnect` event with transport reasons)

### 4.7 Mobile responsiveness

- Stacked layout on mobile (field -> log -> actions)
- Smaller sprites, compact move buttons
- Touch-friendly button sizes

### 4.8 Remove "Coming Soon" from home page

- Update `apps/pokehub-app/app/page.tsx` to set `comingSoon: false` for Battle feature card

---

## Files to Create

| File                                                                                    | Type       | Description                                            |
| --------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------ |
| `packages/frontend/pokehub-battle-components/project.json`                              | Config     | Nx project config (DONE)                               |
| `packages/frontend/pokehub-battle-components/tsconfig.json`                             | Config     | TypeScript config (DONE)                               |
| `packages/frontend/pokehub-battle-components/tsconfig.lib.json`                         | Config     | Lib tsconfig (DONE)                                    |
| `packages/frontend/pokehub-battle-components/src/index.ts`                              | Export     | Public API (DONE)                                      |
| `packages/frontend/pokehub-battle-components/src/lib/hooks/use-battle-socket.ts`        | Hook       | Socket.io connection lifecycle                         |
| `packages/frontend/pokehub-battle-components/src/lib/hooks/use-battle-state.ts`         | Hook       | State reducer                                          |
| `packages/frontend/pokehub-battle-components/src/lib/hooks/use-battle-notifications.ts` | Hook       | Toast notifications when away from battle              |
| `packages/frontend/pokehub-battle-components/src/lib/context/battle-socket.context.tsx` | Context    | Socket + state + notifications provider                |
| `packages/frontend/pokehub-battle-components/src/lib/types/battle-ui.types.ts`          | Types      | UI state types (DONE)                                  |
| `packages/frontend/pokehub-battle-components/src/lib/components/lobby/*`                | Components | Lobby UI (4 files)                                     |
| `packages/frontend/pokehub-battle-components/src/lib/components/battlefield/*`          | Components | Battle field (6 files)                                 |
| `packages/frontend/pokehub-battle-components/src/lib/components/actions/*`              | Components | Action panel (5 files)                                 |
| `packages/frontend/pokehub-battle-components/src/lib/components/info/*`                 | Components | Header/timer/log (3 files)                             |
| `packages/frontend/pokehub-battle-components/src/lib/components/end/*`                  | Components | End overlay (1 file)                                   |
| `packages/frontend/pokehub-battle-components/src/lib/components/active-battle-bar.tsx`  | Component  | Persistent floating bar for returning to active battle |
| `apps/pokehub-app/app/battle/layout.tsx`                                                | Layout     | Auth guard only                                        |
| `apps/pokehub-app/app/battle/page.tsx`                                                  | Page       | Battle lobby                                           |
| `apps/pokehub-app/app/battle/[battleId]/page.tsx`                                       | Page       | Active battle                                          |

## Files to Modify

| File                                                                                      | Change                                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `apps/pokehub-api/src/battle/services/battle-manager/battle-manager.service.ts`           | Phase 0 (DONE)                                                      |
| `apps/pokehub-api/src/battle/services/battle-manager/battle-manager.service.interface.ts` | Phase 0 (DONE)                                                      |
| `packages/backend/pokehub-redis/src/lib/redis.types.ts`                                   | Phase 0 (DONE)                                                      |
| `apps/pokehub-api/src/battle/battle.gateway.ts`                                           | Phase 0 (DONE)                                                      |
| `apps/pokehub-app/router.ts`                                                              | Add `/battle` privileged route (DONE)                               |
| `apps/pokehub-app/app/(components)/app.tsx`                                               | Wrap children with `BattleSocketProvider`                           |
| `apps/pokehub-app/app/page.tsx`                                                           | Remove `comingSoon: true` from Battle card                          |
| `tsconfig.base.json`                                                                      | Add `@pokehub/frontend/pokehub-battle-components` path alias (DONE) |
| `package.json`                                                                            | Add `@pkmn/client` dependency (DONE)                                |

## Reused Existing Code

| What                                                                                                | From                                            | Usage                                  |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------- |
| `ServerBattleEvent`, `ClientBattleEvent`, `BATTLE_EVENT`, `BATTLE_NAMESPACE`                        | `@pokehub/shared/pokemon-battle-types`          | All event types + constants            |
| `Button`, `Card`, `Badge`, `Select`, `Dialog`, `Tabs`, `ScrollArea`, `Skeleton`                     | `@pokehub/frontend/shared-ui-components`        | UI primitives                          |
| `typeColors`, `getTypeColor()`                                                                      | `@pokehub/frontend/shared-utils`                | Move type colors                       |
| `getFormatsForGeneration()`, `groupFormatsByCategory()`, `searchFormats()`, `getShowdownFormatId()` | `@pokehub/frontend/dex-data-provider`           | Format selector (same as Team Builder) |
| `PokemonTypeBadge`                                                                                  | `@pokehub/frontend/pokehub-ui-components`       | Type badges                            |
| `useAuthSession()`                                                                                  | `@pokehub/frontend/shared-auth`                 | Access token for socket                |
| `useUserTeams()`                                                                                    | `@pokehub/frontend/pokehub-team-builder`        | Team list for selector                 |
| `handleServerAuth()`                                                                                | `apps/pokehub-app/app/(utils)/handleServerAuth` | Layout auth guard                      |
| `toast`                                                                                             | `sonner` (via shared-ui-components Toaster)     | Error notifications                    |
| `@pkmn/img`                                                                                         | Already installed                               | Pokemon sprites                        |
| `@pkmn/data` + `@pkmn/dex`                                                                          | Already installed                               | Generations data for @pkmn/client      |
| `@pkmn/client`                                                                                      | New install                                     | Protocol parsing                       |

---

## Verification

```bash
# Build the new package
nx build pokehub-battle-components

# Start backend + frontend
nx serve pokehub-api pokehub-app

# Start Redis + PostgreSQL
docker compose -f docker-compose.dev.yaml up -d redis postgres

# Manual test flow:
# 1. Login with Google OAuth
# 2. Navigate to /battle
# 3. Select format + team
# 4. Click "Find Battle" (need 2 browser windows/tabs with different users)
# 5. Verify match found, battle starts
# 6. Select moves, verify updates
# 7. Forfeit, verify end screen
# 8. Save replay, verify confirmation

# Navigation persistence test flow:
# 1. Start a battle (steps 1-5 above)
# 2. Navigate to /team-builder — verify active battle bar appears at bottom
# 3. Have opponent make a move — verify "It's your turn!" toast appears
# 4. Click "Return to Battle" on the bar — verify battle state is intact
# 5. Navigate to /pokedex — verify bar reappears with current status
# 6. Wait for turn timer warning — verify warning toast appears
# 7. Click "Go to battle" on toast — verify navigation back works
# 8. Refresh the page on /team-builder — verify BATTLE_RESTORED toast + bar
```

---

## Phase 5: Showdown-Aligned Battle UI Enhancements

Bring the battle UI closer to Pokemon Showdown's information density and visual feedback. Players currently lack key combat data (move power, abilities, stat stages) that they need every turn, and battle updates appear instantly with no animation.

Priority order: Move Information → Pokemon Details → Generation Mechanics → Field & Side Conditions → Informational → Active Pokemon Status → Battle Animations.

---

### 5.1 Move Information

**Current state:** `move-button.tsx` shows name, type, PP. Missing: base power, accuracy, category, description.

**Changes:**

**A. Add power, accuracy, category to move buttons**

**File:** `move-button.tsx`

Add props: `power?: number | null`, `accuracy?: number | true | null`, `category?: 'Physical' | 'Special' | 'Status'`.

Display layout (inside the existing button):
- Top-right: type label (already there)
- Below name: `BP {power} · {accuracy}%` inline with a category icon (Physical ⚔, Special ✦, Status ◎)
- PP stays at bottom-left

**File:** `move-panel.tsx`

The `dexMove` lookup already exists (line 26). Pass additional data:

```tsx
<MoveButton
  ...existing
  power={dexMove?.basePower || null}
  accuracy={dexMove?.accuracy ?? null}
  category={dexMove?.category}
/>
```

**B. Move tooltip on hover/long-press**

**New file:** `.../components/actions/move-tooltip.tsx`

Wraps each `MoveButton` with a `Tooltip` (from shared-ui-components). Content:
- Move description (`dexMove.shortDesc` or `dexMove.desc`)
- Secondary effect chance (`dexMove.secondary?.chance`)
- Priority (`dexMove.priority` if non-zero, e.g. "+1 Priority")
- Flags: contact, sound, punch, bite, bullet (from `dexMove.flags`)
- Type effectiveness hint against the opponent's known types (use `battle.p2.active[0]?.types`)

Data source: `battle.gen.moves.get(move.id)` — already available from `@pkmn/dex`.

**File:** `move-panel.tsx` — wrap `MoveButton` with `MoveTooltip`, passing `dexMove` and opponent types.

---

### 5.2 Pokemon Details on Nameplate

**Current state:** `pokemon-side.tsx` shows name, level, gender, status, HP bar. Missing: held item, ability, stat stages.

**Changes:**

**File:** `pokemon-side.tsx`

**A. Held item display**

Below the name row, show the item if known:
```tsx
{pokemon.item && (
  <span className="text-[11px] text-muted-foreground">
    {pokemon.item}
  </span>
)}
```

Note: `@pkmn/client`'s `Pokemon.item` is the current item string (empty if consumed/knocked off). For the opponent, it's only revealed when the protocol announces it (e.g. via `-item` or `-enditem`).

**B. Ability display**

Show ability below item:
```tsx
{pokemon.ability && (
  <span className="text-[11px] text-muted-foreground italic">
    {pokemon.ability}
  </span>
)}
```

Same visibility rules — opponent ability is only shown when revealed in battle.

**C. Stat stages**

**New file:** `.../components/battlefield/stat-stages.tsx`

Renders non-zero boost stages from `pokemon.boosts` (`{ atk, def, spa, spd, spe, accuracy, evasion }`):

```tsx
interface StatStagesProps {
  boosts: { [stat: string]: number };
}
```

Display as inline colored badges:
- Positive boosts: green text (e.g. "Atk +2")
- Negative boosts: red text (e.g. "Spe -1")
- Only show non-zero stats
- Compact: `Atk +2 Def +1` in a flex-wrap row

Mount in `pokemon-side.tsx` below the HP bar for both player and opponent.

---

### 5.3 Generation Mechanics

Support gen-specific battle gimmicks. The `@pkmn/client` Battle `request` object exposes these via `canMegaEvo`, `canZMove`, `canDynamax`, `canTerastallize`.

**A. Mega Evolution**

**File:** `action-panel.tsx` / `move-panel.tsx`

When `request.active[0].canMegaEvo` is true:
- Show a "Mega Evolve" toggle button above the move grid
- When toggled on, append ` mega` to the move choice string (e.g. `move 1 mega`)
- Visual: button with Mega Evolution icon, toggles between default and active state

**B. Z-Moves**

When `request.active[0].canZMove` is truthy (array of z-move data):
- Show "Z-Move" toggle button
- When active, replace move buttons with the Z-move versions from `canZMove[i]`
- Append ` zmove` to choice string

**C. Dynamax**

When `request.active[0].canDynamax` is true:
- Show "Dynamax" toggle button
- When active, replace moves with Max Move versions (from `canDynamax`)
- Append ` dynamax` to choice string
- Show 3-turn Dynamax counter on active Pokemon when dynamaxed (`pokemon.volatiles.dynamax`)

**D. Terastallization**

When `request.active[0].canTerastallize` is truthy (tera type string):
- Show "Terastallize" toggle with the tera type badge
- Append ` terastallize` to choice string
- Show tera type indicator on Pokemon sprite/nameplate when tera'd (`pokemon.teraType`)

**Implementation approach:** Add a `MechanicToggle` component and local state in `ActionPanel` for `activeMechanic: 'mega' | 'zmove' | 'dynamax' | 'tera' | null`. Only one can be active per turn. Reset on new turn (when request changes).

---

### 5.4 Field & Side Conditions

**Current state:** `field-effects.tsx` shows weather, terrain, pseudo-weather. Missing: entry hazards, screens, tailwind, duration counters.

**Changes:**

**File:** `field-effects.tsx`

**A. Side conditions (hazards + screens)**

Access via `battle.p1.sideConditions` / `battle.p2.sideConditions` (object keyed by condition ID).

Add props: `playerSide: Side`, `opponentSide: Side`.

Show per-side:
- Entry hazards: Stealth Rock, Spikes (with layer count), Toxic Spikes (with layer count), Sticky Web
- Screens: Reflect, Light Screen, Aurora Veil (with remaining turn count from `sideConditions[id].duration`)
- Tailwind (with duration)

Layout: Two rows (opponent side conditions above field effects, player side conditions below), or integrated near each player's Pokemon side.

**B. Weather/Terrain duration**

If `field.weatherData?.duration` or `field.terrainData?.duration` exist, show remaining turns next to the badge (e.g. "Rain (3)").

---

### 5.5 Informational Enhancements

**A. Type effectiveness hints on move buttons**

In `move-tooltip.tsx`, calculate effectiveness against the opponent's active Pokemon types using `@pkmn/data`'s type chart:

```tsx
const types = battle.gen.types;
const effectiveness = types.totalEffectiveness(moveType, opponentTypes);
```

Show as a small indicator: "2x", "0.5x", "0x" or color-coded dot on the move button itself.

**B. Trapped indicator explanation**

In the "Switch" tab of `action-panel.tsx`, when `trapped` is true, show a tooltip/text explaining why (e.g. "Trapped by Shadow Tag", "Trapped by Arena Trap"). Read from `pokemon.volatiles` for trapping moves or `opponent.ability` for trapping abilities.

---

### 5.6 Active Pokemon Volatile Status

**Current state:** `status-badge.tsx` handles the 6 primary statuses. Missing: confusion, substitute, other volatiles.

**Changes:**

**File:** new `volatile-badges.tsx`

Read from `pokemon.volatiles` object. Show relevant volatile conditions:
- Confusion (`confusion`) — "CNF" badge in yellow
- Substitute (`substitute`) — shield icon or "SUB" badge
- Perish Song (`perishsong`) — "Perish {N}" with countdown from `volatiles.perishsong.duration`
- Leech Seed (`leechseed`) — "Seeded" badge
- Curse (`curse`) — "Cursed" badge
- Encore (`encore`) — "Encored" badge
- Taunt (`taunt`) — "Taunted" badge

Mount alongside the primary `StatusBadge` in `pokemon-side.tsx`.

---

### 5.7 Battle Animations & Turn Playback

**Current state:** Protocol text from `BATTLE_UPDATE` is processed all at once — HP changes, faints, status, and log entries all appear simultaneously. There's no visual feedback showing *what happened*.

**Goal:** Play through turn events sequentially so the user sees each action: attack animation → damage → status applied → next action. Similar to how Showdown queues up messages and plays them with delays.

**Approach:** Use `@pkmn/protocol` to parse protocol lines into discrete steps, then play them with timed delays using an animation queue.

**A. Animation queue system**

**New file:** `.../hooks/use-animation-queue.ts`

```tsx
interface AnimationStep {
  /** Protocol args for this step (from Protocol.parse) */
  args: Protocol.ArgType;
  kwArgs: Protocol.KWArgType;
  /** Delay in ms to wait AFTER this step before the next */
  delayMs: number;
}

function useAnimationQueue(): {
  /** Whether animations are currently playing */
  isAnimating: boolean;
  /** Enqueue a batch of steps (one turn's worth) */
  enqueue: (steps: AnimationStep[]) => void;
  /** Current step being displayed (null when idle) */
  currentStep: AnimationStep | null;
  /** Skip remaining animations and show final state */
  skip: () => void;
};
```

The queue processes steps one at a time, waiting `delayMs` between each. When the queue is empty, `isAnimating` becomes false.

**B. Step-by-step protocol feeding**

**File:** `use-battle-state.ts`

Currently, `processBattleProtocol()` iterates through all parsed protocol messages in one loop and feeds them to `Battle` immediately. Change this:

1. On `BATTLE_UPDATE`, parse protocol into individual messages but don't feed them to `Battle` yet
2. Store the raw parsed messages as an animation batch
3. The animation queue plays them one at a time, calling `battle.add(args, kwArgs)` per step
4. HP bar, sprites, and log update incrementally as each step plays

This requires splitting the current "process all at once" pattern into "enqueue for animated playback".

**C. Delay mapping by protocol message type**

Different protocol messages warrant different animation durations:

| Protocol message | Delay (ms) | Visual effect |
|-----------------|-----------|---------------|
| `\|move\|` | 600 | Flash/shake on the attacker sprite |
| `\|-damage\|` / `\|-heal\|` | 400 | HP bar animates (already has CSS transition) |
| `\|-status\|` / `\|-curestatus\|` | 300 | Status badge appears/disappears |
| `\|-boost\|` / `\|-unboost\|` | 300 | Stat stage badge animates in |
| `\|faint\|` | 800 | Sprite fade-out (already has CSS) |
| `\|switch\|` / `\|drag\|` | 500 | Sprite swap animation |
| `\|-weather\|` / `\|-fieldstart\|` | 300 | Field effect badge appears |
| `\|turn\|` | 200 | Turn counter increments |
| `\|-supereffective\|` / `\|-resisted\|` | 0 | Just log text, no extra delay |
| Other / info messages | 0 | No delay |

**D. Sprite animations**

**File:** `pokemon-sprite.tsx`

Add CSS classes triggered by the current animation step:

- **Attack:** Brief translateX shake (toward opponent) + scale pulse
  ```css
  @keyframes attack-physical { 0% { transform: translateX(0) } 50% { transform: translateX(20px) scale(1.05) } 100% { transform: translateX(0) } }
  @keyframes attack-special { 0% { opacity: 1 } 50% { opacity: 0.6; filter: brightness(1.5) } 100% { opacity: 1 } }
  ```
- **Damage taken:** Brief red flash + small shake
  ```css
  @keyframes hit { 0%,100% { filter: none } 25%,75% { filter: brightness(0.6) saturate(2) } 50% { transform: translateX(-5px) } }
  ```
- **Faint:** Already has opacity transition — keep as-is
- **Switch in:** Slide in from below with fade
- **Switch out:** Slide out upward with fade

Add `animationState` prop to `PokemonSprite`: `'idle' | 'attacking' | 'hit' | 'switching-in' | 'switching-out'`.

**E. Skip button**

When `isAnimating` is true, show a "Skip" button (or make clicking the battle area skip). This calls `skip()` which processes all remaining steps instantly (same as current behavior) and clears the queue.

**F. Battle container integration**

**File:** `battle-container.tsx`

- Disable the action panel while `isAnimating` (prevent submitting moves during playback)
- Pass `animationState` to `PokemonSprite` based on `currentStep`
- Auto-scroll battle log as each step adds a new entry

**Important considerations:**
- If a new `BATTLE_UPDATE` arrives while animations are still playing, either queue the new batch after current or skip current + start new
- On `BATTLE_RESTORED`, skip all animations and show final state immediately (no point animating history)
- The `Battle` object must stay in sync — steps feed into it incrementally, so HP/status reads are correct at each point during playback

---

### Files to Create

| File | Description |
|------|-------------|
| `.../components/actions/move-tooltip.tsx` | Hover/long-press tooltip with move details + effectiveness |
| `.../components/battlefield/stat-stages.tsx` | Stat boost/drop display badges |
| `.../components/battlefield/volatile-badges.tsx` | Volatile condition indicators |
| `.../components/actions/mechanic-toggle.tsx` | Mega/Z-Move/Dynamax/Tera toggle button |
| `.../hooks/use-animation-queue.ts` | Animation queue for sequential turn playback |

### Files to Modify

| File | Change |
|------|--------|
| `.../actions/move-button.tsx` | Add power, accuracy, category display |
| `.../actions/move-panel.tsx` | Pass move data to buttons, wrap with tooltip |
| `.../battlefield/pokemon-side.tsx` | Add item, ability, stat stages, volatile badges |
| `.../battlefield/pokemon-sprite.tsx` | Add animation states (attack, hit, switch-in/out) |
| `.../battlefield/field-effects.tsx` | Add side conditions (hazards, screens), duration counters |
| `.../actions/action-panel.tsx` | Add mechanic toggles, disable during animations |
| `.../battlefield/battle-container.tsx` | Integrate animation queue, pass animation state to sprites |
| `.../hooks/use-battle-state.ts` | Split protocol processing for animated vs immediate playback |
| `.../battlefield/status-badge.tsx` | Minor: ensure it coexists with volatile badges |

### Verification

```bash
nx build pokehub-app

# Manual:
# 1. Start battle → verify move buttons show BP, accuracy, category icon
# 2. Hover a move → tooltip shows description, flags, effectiveness
# 3. Pokemon nameplate shows item + ability when revealed in battle
# 4. Use a stat-boosting move → verify "+1 Atk" badge appears
# 5. Attack plays: sprite shakes → HP bar animates down → log entry appears
# 6. Faint plays: sprite fades out with delay after HP hits 0
# 7. Switch plays: old Pokemon slides out, new slides in
# 8. "Skip" button instantly shows final state
# 9. Stealth Rock → verify hazard badge appears on opponent's side
# 10. Set up weather → verify duration counter appears
# 11. In a gen with Mega → verify Mega toggle appears and works
# 12. Terastallize → verify tera type indicator on Pokemon
# 13. Pokemon gets confused → "CNF" badge appears
# 14. Opponent is trapped → Switch tab explains why
```
