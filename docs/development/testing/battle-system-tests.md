# Battle System Tests

Tests added as part of the battle system test plan, organized by phase.

## Phase 1: Pure Logic Tests (Frontend)

Pure function tests with zero or minimal mocks — highest ROI.

### Battle State Reducer

**File:** `packages/frontend/pokehub-battle-components/src/lib/state/battle-state-reducer.spec.ts`

Covers every reducer event type against `initialBattleUIState`:
- Queue lifecycle: `QUEUE_JOINED`, `QUEUE_LEFT`
- Match lifecycle: `MATCH_FOUND`, `MATCH_CANCELLED`
- Battle lifecycle: `_BATTLE_INITIALIZED`, `_BATTLE_UPDATED`, `_BATTLE_RESTORED`, `BATTLE_END`
- Timer and connectivity: `TURN_WARNING`, `OPPONENT_DISCONNECTED`, `OPPONENT_RECONNECTED`
- Player actions: `CHOICE_SUBMITTED`, `CANCEL_CHOICE`
- Misc: `REPLAY_SAVED`, `ERROR`, `RESET`, unknown event passthrough
- Immutability: original state is never mutated

### Animation Events Extraction

**File:** `packages/frontend/pokehub-battle-components/src/lib/utils/animation-events.spec.ts`

Covers `extractAnimationEvent` for each Pokemon Showdown protocol command:
- Battle actions: `move`, `-damage`, `-heal`, `faint`, `switch`, `drag`
- Stat changes: `-boost`, `-unboost` (with default amount)
- Status/environment: `-status`, `-weather`, `-fieldstart` (terrain detection)
- Effectiveness modifiers: `-supereffective`, `-resisted`, `-crit`, `-miss`
- Edge cases: 0 HP (fainted), status suffix parsing, unknown commands, null args

### Process Pending Events

**File:** `packages/frontend/pokehub-battle-components/src/lib/state/process-pending-events.spec.ts`

Covers the event processing loop ordering and dispatch behavior:
- Event ordering: move (log before animation), damage (animation before log)
- Switch sequences: switch-out → battle.add → switch-in
- Modifier merging: supereffective/resisted merged onto following damage event
- Special events: `rule` (HTML generation), `tier` (HTML generation), `request` (perspective)
- Skip mode: all events processed without animations when skipRef=true
- Dispatch correctness: all intermediate dispatches carry `turnProcessing: true`

## Phase 2: Backend Unit Tests

### Match Orchestrator Service

**File:** `apps/pokehub-api/src/battle/services/match-orchestrator/match-orchestrator.service.spec.ts`

**`tryFindMatch`** — orchestrates the full match → battle creation flow:
- No match found → early return
- Match found → user lookup, BattleConfig creation, battle creation
- User lookup failure → error logging, no events emitted
- Username fallback to `Player {userId.slice(0,8)}`
- Socket room joining, skipping when socket not found
- Event emission order: `MATCH_FOUND` then `BATTLE_START` per player
- Battle creation failure → error logging, no events

**`declineMatch`** — handles match decline and opponent requeueing:
- Missing/invalid battle metadata → warning, early return
- userId not in battle → warning, early return
- Battle cancellation, `MATCH_CANCELLED` emission to opponent
- Opponent requeued with original format/team, `tryFindMatch` called for them
- Works regardless of which player declines

### Battle Socket Bridge Service

**File:** `apps/pokehub-api/src/battle/services/battle-socket-bridge/battle-socket-bridge.service.spec.ts`

**Socket mapping** — register, unregister, getSocketId, SERVER_STATUS on redis-down registration, SESSION_REPLACED on duplicate socket (last-connection-wins), stale unregister doesn't remove active mapping

**Event emission** — direct emit for local sockets, Redis publish for remote

**Redis message routing** — forwarding user battle events, per-player state updates, opponent disconnect/reconnect/turn-warning events, battle end (room emit + unsubscribe), malformed JSON resilience

**Redis status** — restored/unavailable broadcasts on status transitions, no broadcast when already healthy

**Lifecycle** — heartbeat interval, destroy cleanup

### Matchmaking Service (Updated)

**File:** `apps/pokehub-api/src/battle/services/matchmaking/matchmaking.service.spec.ts`

Pre-existing tests updated, plus new coverage for:
- `leaveQueue` — parallel clearUserQueueStatus + removeFromQueue, early return when not in queue
- `findMatch` — handling mismatched formats (put back both players), correct player data in MatchResult

## Phase 3: Gateway + Frontend Component Tests

### Battle Gateway

**File:** `apps/pokehub-api/src/battle/battle.gateway.spec.ts`

Covers the WebSocket gateway as a thin validation/delegation layer:
- `handleConnection` — auth rejection, socket registration, active battle restoration
- `handleDisconnect` — cleanup, battle disconnect handling, conditional queue count broadcast
- `handleJoinQueue` — payload validation, error cases (team not found, not owned)
- `handleLeaveQueue` — queue leave + QUEUE_LEFT emission
- `handleMove` / `handleForfeit` — validation + delegation to battleManager
- `handleRejoin` — reconnect, room join, BATTLE_RESTORED emission
- `handleObserveQueue` / `handleUnobserveQueue` — lobby room join/leave

### ActionPanel Component

**File:** `packages/frontend/pokehub-battle-components/src/lib/components/actions/action-panel.spec.tsx`

Covers the main interactive battle component:
- Waiting states: no request, wait request
- Move request: Moves/Switch tabs rendered, trapped → Switch disabled
- Pending choice: choice label display, "Change Move" button + cancel callback
- Special requests: team preview ("Choose your lead"), force-switch ("Choose a Pokemon to switch in")

### BattleEndOverlay Component

**File:** `packages/frontend/pokehub-battle-components/src/lib/components/end/battle-end-overlay.spec.tsx`

Covers end-of-battle state rendering:
- Outcome display: Victory, Defeat, Draw based on winner
- Replay: Save Replay button states (enabled, saved/disabled), save callback
- Navigation: "Find New Battle" → /battle, "Exit" → /
- End reason: displayed for non-standard reasons, hidden for "win"/"draw"

## Phase 4: E2E Tests

### Backend E2E Extensions

**File:** `apps/pokehub-api-e2e/src/pokehub-api/battle.spec.ts` (extended existing file)

New flows added to the existing backend E2E suite:
- **Match decline** — player declines → opponent gets `MATCH_CANCELLED`, is requeued
- **Queue observer** — `OBSERVE_QUEUE` → `QUEUE_COUNTS` → updates on join/leave → `UNOBSERVE_QUEUE`
- **Cancel choice** — submit move → `CANCEL_CHOICE` → submit different move
- **Reconnection** — player disconnects → opponent notified → rejoin → receive battle state

### Frontend E2E (Playwright)

**File:** `apps/pokehub-app-e2e/src/battle.spec.ts` (new file)

Two authenticated browser contexts (user + battle opponent). Redis cleanup in global-setup prevents stale state across runs.

**Battle Lobby** — page load, Random/Competitive tabs, format options, button disabled/enabled states, competitive tab with team selector, queue status display, cancel queue

**Battle Flow** (serial execution) — two-player matchmaking, forfeit confirmation dialog (open + cancel), forfeit ending battle with correct overlays for both players, navigation from end overlay back to lobby, opponent disconnected overlay on context close
