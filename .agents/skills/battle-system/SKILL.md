---
name: battle-system
description: Add or modify PokeHub battle features (matchmaking, the turn loop, WebSocket protocol, reconnect/recovery, animations/audio) while preserving the system's non-obvious invariants. Use when a change touches the battle gateway, battle-manager, turn-timer, matchmaking, the shared battle protocol types, or the frontend battle reducer/socket/animation layer.
---

# Battle system (PokeHub)

The battle system is the most cross-cutting area in the repo: a change often spans the **shared
protocol types**, the **backend** (gateway + battle-manager + turn-timer + Redis), and the
**frontend** (socket → reducer → animation/audio). Most bugs here come from breaking a *silent
invariant*, not from a compile error. This skill is a guardrail + workflow router — the design
detail lives in the docs below, and the current file/symbol locations live in graphify.

## First: orient (graphify + docs)

Don't trust the paths in this file to be current — confirm with **graphify** before editing:
- `graphify query "battle turn execution and choice processing"`
- `graphify query "battle reconnect and recovery flow"`
- `graphify path "<changed export>" "<consumer>"` to trace blast radius (this layer has high fan-in).

**Reference docs (read, don't duplicate):**
- [`docs/features/battle-system.md`](../../../docs/features/battle-system.md) — backend design: Redis model, WS protocol, core flows, engine integration, concurrency.
- [`docs/features/battle-frontend-architecture.md`](../../../docs/features/battle-frontend-architecture.md) — socket → reducer → render pipeline.
- [`docs/features/battle-pkmn-integration.md`](../../../docs/features/battle-pkmn-integration.md) — `@pkmn/sim` streams, protocol parsing, `@pkmn/client` state.
- [`docs/features/battle-animation-system.md`](../../../docs/features/battle-animation-system.md) and [`battle-audio-system.md`](../../../docs/features/battle-audio-system.md) — animation/audio layers.
- [`docs/development/testing/battle-system-tests.md`](../../../docs/development/testing/battle-system-tests.md) — what to test and how.

## Where each concern lives (verify with graphify)

- **Shared protocol** — `packages/shared/pokemon-battle-types` (`client-events.ts`, `server-events.ts`,
  `socket.constants.ts`, `dto/`, `errors.ts`). The contract between FE and BE. Change here first.
- **Backend** — `apps/pokehub-api/src/battle`: `battle.gateway.ts` (WS handlers), and `services/`
  (`battle-manager`, `turn-timer`, `matchmaking`, `match-orchestrator`, `battle-persistence`,
  `battle-socket-bridge`).
- **Frontend** — `packages/frontend/pokehub-battle-components/src/lib`: `hooks/` (socket + state),
  `state/` (reducer + `process-pending-events`), `context/`, `animations/`, `audio/`, `components/`.

## Invariants you must preserve

These are the things that look fine in a diff but silently break battles:

1. **Replay log determinism.** Recovery replays the Redis input log against a battle recreated with
   the **same seed**. Only append **executed** choices to the log, and append them **in
   `executeTurn`** (not when a choice is submitted) — otherwise overridden/cancelled choices poison
   the replay and recovery diverges. Never log a `pass`.
2. **Deltas vs. full state.** Live turns publish **cursor deltas** (`p1Delta`/`p2Delta`);
   `BATTLE_START` and reconnect/rejoin (`BATTLE_RESTORED`) send **full state**. After any full-state
   send, call `advanceCursors()` so the next `BATTLE_UPDATE` doesn't re-send everything. Mixing the
   two corrupts the client's `@pkmn/client` Battle.
3. **Timers live in process memory.** They die with the host. On recover/reconnect you must
   **re-arm** `turn-timer`, treating a player as "already chosen" if they have a pending Redis choice
   **or** the sim reports no `requestState` for them (e.g. only the fainted side switches).
4. **Per-battle lock + `awaitingChoices` gate.** All state mutations go through the battle lock;
   choices are rejected unless `awaitingChoices` is true and the turn isn't already locked. Don't add
   a state-changing path that bypasses the lock.
5. **Per-player perspective is redacted.** Send p1 their `p1State`/`p1Delta`, p2 theirs — never the
   omniscient stream. The omniscient buffer is for the replay log only.
6. **Reconnect ≠ new battle.** `BATTLE_RESTORED` must not reset turn/battle identity the way
   `BATTLE_START` does; honor the server's `turnTimeRemaining` (undefined = no active timer for this
   player → render no timer, don't start a fresh full countdown).
7. **Protocol changes are contract changes.** A new WS event or field must be added to the shared
   `client-events.ts`/`server-events.ts` (and DTO/Zod schema if inbound) and handled on both ends;
   the reducer's `ServerBattleEvent` union is exhaustive.

## Add-a-feature workflow

1. **Model the contract** in `pokemon-battle-types` — event/DTO/error + Zod schema for inbound.
2. **Backend**: handle it in the gateway (validate with the DTO schema, `WsJwtGuard` +
   throttling as peers do), and put battle logic in the relevant service behind the battle lock.
3. **Persist what recovery needs** in Redis (via the redis service), and make sure recover/reconnect
   reconstruct it — re-check invariants 1–3.
4. **Frontend**: extend the reducer (`ServerBattleEvent` union stays exhaustive), thread state
   through the socket hook/context, then render. Add animations/audio via their registries, not ad hoc.
5. **Debug** with the client log buffer: `pokehubLogs()` / `await pokehubLogs.copy()` in the browser
   console (see `@pokehub/frontend/shared-logger`).

## Testing gate (both, not either)

- **Unit specs** (co-located `*.spec.ts(x)`): `battle-manager` (turn execution, recovery, timer
  re-arm), the reducer, and `process-pending-events`. NestJS services use `Test.createTestingModule`
  with `useValue` mocks; React uses `QueryClientProvider` with retries off.
- **E2E**: `apps/pokehub-api-e2e/src/pokehub-api/battle.spec.ts` — real socket flows including
  **disconnect → reconnect → recovery**. Reconnect/turn-loop changes are not done until this passes.
- Then run the `ci-check` skill on the affected projects.
