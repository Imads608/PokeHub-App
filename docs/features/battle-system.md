# Battle System Design Document

## Table of Contents

- [Overview](#overview)
- [System Goals](#system-goals)
- [Architecture Overview](#architecture-overview)
  - [Key Design Decisions](#key-design-decisions)
- [Package Structure](#package-structure)
  - [Shared Packages](#shared-packages)
  - [Backend Packages](#backend-packages)
- [Redis Data Model](#redis-data-model)
  - [Pub/Sub Channels](#pubsub-channels)
- [Database Schema](#database-schema)
- [Battle Module Structure](#battle-module-structure)
  - [Service Responsibilities](#service-responsibilities)
- [WebSocket Communication](#websocket-communication)
  - [Connection Flow](#connection-flow)
  - [Authentication Security](#authentication-security)
  - [Event Reference](#event-reference)
- [Core Flows](#core-flows)
  - [1. Matchmaking Flow](#1-matchmaking-flow)
  - [2. Battle Turn Flow](#2-battle-turn-flow)
  - [3. Turn Timer Flow](#3-turn-timer-flow)
  - [4. Disconnect & Reconnect Flow](#4-disconnect--reconnect-flow)
  - [5. Crash Recovery Flow](#5-crash-recovery-flow)
  - [6. Match Decline Flow](#6-match-decline-flow)
- [Battle Engine Integration](#battle-engine-integration)
  - [@pkmn/sim Usage](#pkmnsim-usage)
  - [Team Packing](#team-packing)
  - [Auto-Move on Timeout](#auto-move-on-timeout)
- [Error Handling](#error-handling)
  - [Client Errors](#client-errors)
  - [Battle Errors](#battle-errors)
- [Concurrency & Resource Management](#concurrency--resource-management)
  - [Battle Locking](#battle-locking)
  - [Disconnect Timeout Management](#disconnect-timeout-management)
  - [Gateway Resource Cleanup](#gateway-resource-cleanup)
  - [Zod Validation on WebSocket Handlers](#zod-validation-on-websocket-handlers)
  - [WebSocket Rate Limiting](#websocket-rate-limiting)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Docker Compose (Development)](#docker-compose-development)
- [Implementation Status](#implementation-status)
- [Future Enhancements](#future-enhancements)
- [Related Documentation](#related-documentation)

---

## Overview

This document describes the real-time Pokemon battle system implementation for PokeHub. The system enables competitive Pokemon battles between users using WebSockets, Redis for state management and cross-server communication, and the `@pkmn/sim` battle engine for authentic Pokemon Showdown-compatible battles.

## System Goals

- Enable real-time Pokemon battles between users
- Support horizontal scaling (multiple API instances)
- Handle disconnects gracefully with reconnection support
- Recover battles if a server crashes (deterministic replay)
- Allow users to optionally save replays (no automatic battle history)

## Architecture Overview

```
                            Users
                              |
                    [Load Balancer (Azure)]
                              |
          +-------------------+-------------------+
          |                   |                   |
    +-----------+       +-----------+       +-----------+
    | API       |       | API       |       | API       |
    | Server 1  |<----->| Server 2  |<----->| Server N  |
    | (NestJS)  |       | (NestJS)  |       | (NestJS)  |
    |           |       |           |       |           |
    | Battles   |       | Battles   |       | Battles   |
    | In-Memory |       | In-Memory |       | In-Memory |
    +-----------+       +-----------+       +-----------+
          |                   |                   |
          +-------------------+-------------------+
                              |
                    +-----------------+
                    |     Redis       |
                    | - Pub/Sub       |
                    | - Battle State  |
                    | - Matchmaking   |
                    +-----------------+
                              |
                    +-----------------+
                    |   PostgreSQL    |
                    | - Saved Replays |
                    +-----------------+
```

### Key Design Decisions

| Decision           | Choice                               | Rationale                                     |
| ------------------ | ------------------------------------ | --------------------------------------------- |
| Crash Recovery     | Full recovery via input log replay   | @pkmn/sim is deterministic with same seed     |
| Team Requirement   | Optional teamId (random or bring-your-own) | Random formats auto-generate teams server-side |
| Turn Timer         | Warning at 30s, auto-move at 60s     | Prevents stalling without harsh forfeit       |
| Redis Unavailable  | Fail queue joins                     | Don't allow degraded battles                  |
| Battle Formats     | Support multiple formats             | gen9ou, gen9uu, etc. from start               |
| Replay Saving      | Optional, user chooses at battle end | Save storage, let users keep meaningful ones  |
| Max Replays        | 10 per user                          | Prevents unbounded storage growth             |
| Battle Persistence | Only when replay saved               | No battle history, reduces DB storage         |
| Disconnect Timeout | 2 minutes                            | Balance between recovery and opponent waiting |

---

## Package Structure

### Shared Packages

#### `packages/shared/pokemon-battle-types/`

Shared TypeScript types for the battle system (frontend + backend).

```
src/lib/
├── battle-config.ts      # BattleConfig, BattlePlayer, generateBattleSeed()
├── client-events.ts      # Client → Server WebSocket events
├── server-events.ts      # Server → Client WebSocket events
├── move-anim-config.ts   # MoveAnimConfig discriminated union and config interfaces
├── socket.constants.ts   # BATTLE_NAMESPACE, BattleRooms, BATTLE_EVENT
├── errors.ts             # BattleErrorCode, isRecoverableError()
└── dto/
    ├── join-queue.dto.ts   # Zod schema for queue join
    └── battle-move.dto.ts  # Zod schemas for moves/forfeit/replay
```

**Key Types:**

```typescript
interface BattleConfig {
  id: string;
  format: string;
  player1: BattlePlayer;
  player2: BattlePlayer;
  seed: string; // PRNG seed for deterministic replay
}

interface BattlePlayer {
  id: string;
  name: string;
  teamId: string; // UUID for competitive, 'random' sentinel for random battles
  packedTeam: string; // Pokemon Showdown packed format
}

// Client events
type ClientBattleEvent =
  | { type: 'JOIN_QUEUE'; format: string; teamId?: string }
  | { type: 'LEAVE_QUEUE' }
  | { type: 'MOVE'; battleId: string; choice: string }
  | { type: 'FORFEIT'; battleId: string }
  | { type: 'REJOIN'; battleId: string }
  | { type: 'SAVE_REPLAY'; battleId: string }
  | { type: 'DECLINE_MATCH'; battleId: string };

// Server events
type ServerBattleEvent =
  | { type: 'QUEUE_JOINED'; position: number }
  | { type: 'QUEUE_LEFT' }
  | {
      type: 'MATCH_FOUND';
      battleId: string;
      opponent: { id: string; name: string };
    }
  | { type: 'BATTLE_START'; battleId: string; initialState: string; moveAnimConfigs: Record<string, MoveAnimConfig> }
  | {
      type: 'BATTLE_UPDATE';
      battleId: string;
      data: string;
      autoMove?: boolean;
    }
  | {
      type: 'BATTLE_END';
      battleId: string;
      winner: string | null;
      reason: string;
      canSaveReplay: boolean;
    }
  | { type: 'REPLAY_SAVED'; battleId: string; replayCount: number }
  | { type: 'TURN_WARNING'; battleId: string; secondsRemaining: number }
  | { type: 'OPPONENT_DISCONNECTED'; battleId: string; timeout: number }
  | { type: 'OPPONENT_RECONNECTED'; battleId: string }
  | {
      type: 'BATTLE_RESTORED';
      battleId: string;
      currentState: string;
      moveAnimConfigs: Record<string, MoveAnimConfig>;
      message?: string;
    }
  | { type: 'MATCH_CANCELLED'; battleId: string; reason: string }
  | { type: 'ERROR'; code: string; message: string; recoverable: boolean };
```

### Backend Packages

#### `packages/backend/pokehub-move-anim-catalog/`

Server-side catalog of 172 move animation configs. Provides utilities to extract move names from packed teams and look up their animation configurations. Only the player's own team's move configs are sent to prevent information leaking about the opponent's moves.

**Key Exports:**

| Function                        | Description                                                        |
| ------------------------------- | ------------------------------------------------------------------ |
| `extractMoveNames(packedTeam)`  | Parses a packed team string and returns all unique move names       |
| `getMoveAnimConfigs(moveNames)` | Returns a `Record<string, MoveAnimConfig>` for the given move names |

#### `packages/backend/pokehub-redis/`

Redis service for battle state management and pub/sub.

```
src/lib/
├── backend-pokehub-redis.module.ts  # NestJS module
├── redis.service.ts                 # RedisBattleService class
├── redis.keys.ts                    # Namespaced key builders
└── redis.types.ts                   # Type definitions and parsers
```

**RedisBattleService Methods:**

| Category        | Methods                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Matchmaking     | `joinQueue()`, `popQueueEntries()`, `getQueueLength()`, `setUserQueueStatus()`, `clearUserQueueStatus()` |
| User State      | `setUserBattle()`, `getUserBattle()`, `clearUserBattle()`                                                |
| Battle Metadata | `createBattle()`, `getBattleMetadata()`, `updateBattleMetadata()`, `deleteBattleMetadata()`              |
| Battle Seed     | `setBattleSeed()`, `getBattleSeed()`                                                                     |
| Battle Log      | `appendBattleLog()`, `getBattleLog()`, `setBattleLogTTL()`, `deleteBattleLog()`                          |
| Pending Choices | `setPendingChoices()`, `getPendingChoices()`                                                             |
| Server Health   | `refreshHeartbeat()`, `isServerAlive()`, `addServerBattle()`, `getServerBattles()`                       |
| Pub/Sub         | `publishMatchFound()`, `publishBattleMove()`, `publishBattleUpdate()`, `createSubscriberClient()`        |
| Cleanup         | `cleanupBattle()`, `ping()`                                                                              |

#### `packages/backend/pokehub-battles-db/`

Database persistence for battle replays.

```
src/lib/
├── backend-pokehub-battles-db.module.ts  # NestJS module
├── battles-db.service.ts                 # BattlesDBProvider
├── battles-db-service.interface.ts       # IBattlesDBService
└── schema/
    └── battle.schema.ts                  # Drizzle schema
```

---

## Redis Data Model

```
# Battle metadata (hash)
battle:{battleId}
  - config: JSON string of BattleConfig
  - status: "active" | "completed" | "forfeited"
  - hostServer: server ID hosting this battle
  - pending: JSON of pending choices {"p1": "move 1", "p2": "move 2"}
  - p1Disconnected: "true" | "false"
  - p2Disconnected: "true" | "false"
  - p1DisconnectTime: timestamp (optional)
  - p2DisconnectTime: timestamp (optional)
  - winnerId: winner's user ID (set when battle ends, empty string for draw)

# Battle seed (string)
battle:{battleId}:seed
  - PRNG seed for deterministic replay (e.g., "1234,5678,9012,3456")

# Battle input log (list)
battle:{battleId}:log
  - Ordered list of commands: [">p1 move 1", ">p2 move 2", ...]
  - Set to 1 hour TTL after battle ends for replay save window

# User's current battle (string)
user:{userId}:battle
  - Current active battleId

# User's queue status (string)
user:{userId}:queue
  - Format they're queued for (e.g., "gen9ou")

# Matchmaking queue (list per format)
queue:{format}
  - JSON entries: { userId, teamId, packedTeam, joinedAt }

# Active matchmaking formats (set)
queue:active-formats
  - Set of format strings currently with queued players (e.g., "gen9ou")
  - Populated via SADD when a player joins a queue
  - Lazily cleaned: formats with 0 queue length are removed when getQueueCounts() runs

# Server heartbeat (string with 10s TTL)
server:{serverId}:heartbeat
  - Timestamp, refreshed every 5s

# Battles hosted by server (set)
server:{serverId}:battles
  - Set of battleIds hosted by this server
```

### Pub/Sub Channels

| Channel Pattern            | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `match:user:{userId}`      | Notify user of match found               |
| `battle:{battleId}:move`   | Broadcast moves for multi-server battles |
| `battle:{battleId}:update` | Broadcast battle state updates           |

**Typed Pub/Sub Messages:**

The `battle:{battleId}:update` channel uses a discriminated union (`BattleUpdateMessage`) to distinguish message types:

```typescript
type BattleUpdateMessage =
  | { type: 'state'; data: string } // Raw @pkmn/sim battle output
  | { type: 'event'; data: BattleEventPayload } // Structured events (disconnect, turn warning)
  | { type: 'end'; data: BattleEndData }; // Battle ended (winner, reason)
```

This allows the gateway to handle each message type with proper type safety via a `switch` on `message.type`.

---

## Database Schema

### `battle_replays` Table

```sql
CREATE TABLE battle_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  format VARCHAR(50) NOT NULL,
  player1_id UUID NOT NULL REFERENCES users(id),
  player2_id UUID NOT NULL REFERENCES users(id),
  player1_team_id UUID NOT NULL REFERENCES teams(id),
  player2_team_id UUID NOT NULL REFERENCES teams(id),
  winner_id UUID REFERENCES users(id),
  battle_log JSONB NOT NULL,  -- string[] of input commands
  seed VARCHAR(100) NOT NULL,
  played_at TIMESTAMP NOT NULL,
  saved_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_battle_replays_user ON battle_replays(user_id);
CREATE INDEX idx_battle_replays_battle ON battle_replays(battle_id);
CREATE INDEX idx_battle_replays_saved_at ON battle_replays(saved_at DESC);
```

**Design Notes:**

- Records only created when user explicitly saves a replay
- Each user saves their own copy (both players can save same battle independently)
- Maximum 10 saved replays per user (enforced at application level)

---

## Battle Module Structure

```
apps/pokehub-api/src/battle/
├── battle.module.ts              # NestJS module
├── battle.gateway.ts             # WebSocket gateway
├── guards/
│   └── ws-jwt.guard.ts           # JWT auth for WebSocket
└── services/
    ├── battle-manager/
    │   ├── battle-manager.service.interface.ts
    │   └── battle-manager.service.ts
    ├── matchmaking/
    │   ├── matchmaking.service.interface.ts
    │   └── matchmaking.service.ts
    ├── battle-persistence/
    │   ├── battle-persistence.service.interface.ts
    │   └── battle-persistence.service.ts
    └── turn-timer/
        ├── turn-timer.service.interface.ts
        └── turn-timer.service.ts
```

### Service Responsibilities

| Service                      | Responsibility                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| **BattleGateway**            | WebSocket connection handling, event routing, Redis pub/sub management, server heartbeat |
| **BattleManagerService**     | Battle lifecycle (create, process moves, forfeit), @pkmn/sim integration, crash recovery |
| **MatchmakingService**       | Queue management, match finding (FIFO for MVP), lazy queue removal                       |
| **BattlePersistenceService** | Replay saving/deletion, replay count limits                                              |
| **TurnTimerService**         | Turn timer management, warning/timeout callbacks                                         |

---

## WebSocket Communication

### Connection Flow

1. Client connects to `/battle` namespace with JWT token
2. `WsJwtGuard.validateClient()` extracts and validates JWT
3. Single-socket-per-user enforcement: if the user already has an active socket, the server emits `SESSION_REPLACED` to the old socket and disconnects it (last-connection-wins)
4. User is added to socket-to-user mapping
5. Gateway subscribes to Redis `user:{userId}:battle-events` channel
6. Check for active battle to rejoin (send `BATTLE_RESTORED` if exists)

### Authentication Security

The `WsJwtGuard` accepts tokens from multiple sources. **Use the auth object** for security:

```typescript
// Recommended: Token in auth object (secure)
const socket = io('ws://api.pokehub.app/battle', {
  auth: { token: accessToken },
});

// Alternative: Authorization header (also secure)
const socket = io('ws://api.pokehub.app/battle', {
  extraHeaders: { Authorization: `Bearer ${accessToken}` },
});

// Deprecated: Query params (INSECURE - do not use)
// Tokens in URLs leak via server logs, browser history, and referrer headers
const socket = io(`ws://api.pokehub.app/battle?token=${accessToken}`);
```

**Token Source Priority:**

| Priority | Source               | Security | Notes                               |
| -------- | -------------------- | -------- | ----------------------------------- |
| 1        | `auth.token`         | Secure   | Recommended, sent in handshake body |
| 2        | Authorization header | Secure   | Standard Bearer token               |
| 3        | Query param `token`  | Insecure | Deprecated, logs warning when used  |

### Event Reference

**Client → Server:**

| Event           | Payload                                | Description                                                   |
| --------------- | -------------------------------------- | ------------------------------------------------------------- |
| `JOIN_QUEUE`    | `{ format: string, teamId?: string }`  | Join matchmaking queue (teamId required for competitive, omitted for random) |
| `LEAVE_QUEUE`   | `{}`                                   | Leave queue                                                   |
| `MOVE`          | `{ battleId: string, choice: string }` | Submit move (e.g., "move 1", "switch 2")                      |
| `CANCEL_CHOICE` | `{ battleId: string }`                 | Cancel submitted move before turn resolves                    |
| `FORFEIT`       | `{ battleId: string }`                 | Forfeit battle                                                |
| `REJOIN`        | `{ battleId: string }`                 | Reconnect to active battle                                    |
| `SAVE_REPLAY`   | `{ battleId: string }`                 | Save replay (within 1 hour of battle end)                     |
| `DECLINE_MATCH` | `{ battleId: string }`                 | Decline match (client left queue before MATCH_FOUND received) |
| `OBSERVE_QUEUE`    | `{}`                                | Subscribe to real-time queue player counts per format         |
| `UNOBSERVE_QUEUE`  | `{}`                                | Unsubscribe from queue player count updates                   |

**Server → Client:**

| Event                   | Payload                                       | Description                |
| ----------------------- | --------------------------------------------- | -------------------------- |
| `QUEUE_JOINED`          | `{ position: number }`                        | Confirmed in queue         |
| `QUEUE_LEFT`            | `{}`                                          | Left queue                 |
| `MATCH_FOUND`           | `{ battleId, opponent: { id, name } }`        | Match created              |
| `BATTLE_START`          | `{ battleId, initialState, moveAnimConfigs }`  | Battle beginning           |
| `BATTLE_UPDATE`         | `{ battleId, data, autoMove? }`               | Turn result                |
| `BATTLE_END`            | `{ battleId, winner, reason, canSaveReplay }` | Battle over                |
| `REPLAY_SAVED`          | `{ battleId, replayCount }`                   | Replay saved               |
| `TURN_WARNING`          | `{ battleId, secondsRemaining }`              | Timer warning (30s left)   |
| `OPPONENT_DISCONNECTED` | `{ battleId, timeout }`                       | Player disconnected        |
| `OPPONENT_RECONNECTED`  | `{ battleId }`                                | Player reconnected         |
| `BATTLE_RESTORED`       | `{ battleId, currentState, moveAnimConfigs, message? }` | Reconnection state         |
| `MATCH_CANCELLED`       | `{ battleId, reason }`                        | Match declined by opponent |
| `QUEUE_COUNTS`          | `{ counts: Record<string, number> }`          | Queue player counts per format |
| `SERVER_STATUS`         | `{ status: 'unavailable' \| 'restored' }`     | Redis/server health change |
| `SESSION_REPLACED`      | (no payload)                                  | Another tab connected, this socket is disconnected |
| `ERROR`                 | `{ code, message, recoverable }`              | Error occurred             |

---

## Core Flows

### Matchmaking: Queue Removal

When a player leaves the queue, `leaveQueue()` clears their `user:{userId}:queue` status key **and** removes their entry from the Redis list via `LRANGE` + `LREM`. This ensures `LLEN`-based queue counts are immediately accurate for lobby observers.

`LREM` is O(n) but queue sizes are small, so this is negligible. The operation is also safe across multiple server instances — concurrent `LREM` calls for the same entry are idempotent (the second returns 0).

As a fallback, `findMatch()` still validates popped entries against their status key, discarding any stale entries that weren't cleaned up (e.g. due to a partial failure where `clearUserQueueStatus` succeeded but `removeFromQueue` failed).

### 1. Matchmaking Flow

```
Client                      Gateway                      Redis
  |                           |                            |
  |-- JOIN_QUEUE ------------>|                            |
  |   {format, teamId?}       |                            |
  |                           |                            |
  |                           |-- if teamId: fetch & pack team from DB
  |                           |-- if !teamId: validate isRandomFormat(),
  |                           |   generate team via @pkmn/randoms,
  |                           |   use teamId='random' sentinel
  |                           |                            |
  |                           |-- LPUSH queue:{format} --->|
  |                           |-- SET user:{id}:queue ---->|
  |                           |                            |
  |<-- QUEUE_JOINED ----------|                            |
  |   {position}              |                            |
  |                           |                            |
  |                           |-- Check queue length >= 2  |
  |                           |<-- RPOP x2 ----------------|
  |                           |                            |
  |                           |-- Create BattleConfig      |
  |                           |-- battleManager.create()   |
  |                           |                            |
  |                           |-- PUB match:user:{p1} ---->|
  |                           |-- PUB match:user:{p2} ---->|
  |                           |                            |
  |<-- MATCH_FOUND -----------|                            |
  |<-- BATTLE_START ----------|                            |
  |                           |                            |
  |                           |-- Broadcast QUEUE_COUNTS   |
  |                           |   to lobby room observers  |
```

### 2. Battle Turn Flow

```
Player 1      Player 2      BattleManager      Redis
   |             |               |               |
   |-- MOVE ---->|               |               |
   |  "move 1"   |               |               |
   |             |               |               |
   |             |<-- MOVE ------|               |
   |             |   "move 2"    |               |
   |             |               |               |
   |             |               |-- Store pending choices
   |             |               |-- RPUSH to log |
   |             |               |               |
   |             |               |-- Both choices received
   |             |               |-- Execute via @pkmn/sim
   |             |               |               |
   |             |               |-- PUB battle:update -->|
   |             |               |               |
   |<-- BATTLE_UPDATE ----------|               |
   |             |<-- BATTLE_UPDATE -------------|
   |             |               |               |
   |             |               |-- Start new turn timers
```

### 3. Turn Timer Flow

```
                 Time
                   |
     Turn Start    |
         |         |
         v         |
    [30 seconds]   |
         |         |
         v         |
    TURN_WARNING   |  <-- Sent to player who hasn't chosen
    (30s left)     |
         |         |
         v         |
    [30 seconds]   |
         |         |
         v         |
    TIMEOUT        |  <-- Auto-select move via side.autoChoose()
```

### 4. Disconnect & Reconnect Flow

```
Player 1      Player 2      BattleManager      Redis
   |             |               |               |
   X (disconnect)|               |               |
                 |               |               |
                 |               |-- HSET p1Disconnected=true
                 |               |-- PUB opponent_disconnected
                 |               |               |
                 |<-- OPPONENT_DISCONNECTED -----|
                 |   {timeout: 120}              |
                 |               |               |
                 |               |-- Start 2-min timeout
                 |               |               |
   |-- Reconnect -->             |               |
   |             |               |               |
                 |               |-- HSET p1Disconnected=false
                 |               |-- PUB opponent_reconnected
                 |               |               |
   |<-- BATTLE_RESTORED ---------|               |
                 |<-- OPPONENT_RECONNECTED ------|
```

### 5. Crash Recovery Flow

```
Player 1      Dead Server      New Server      Redis
   |               X               |              |
   |                               |              |
   |-- Reconnect (via LB) -------->|              |
   |                               |              |
   |                               |-- GET user:battle
   |                               |<-- "abc123"  |
   |                               |              |
   |                               |-- HGETALL battle:abc123
   |                               |<-- {hostServer: dead}
   |                               |              |
   |                               |-- GET server:dead:heartbeat
   |                               |<-- NULL (expired)
   |                               |              |
   |                               |-- LRANGE battle:abc123:log
   |                               |<-- [all commands]
   |                               |              |
   |                               |-- Replay all commands
   |                               |   via @pkmn/sim
   |                               |              |
   |                               |-- HSET hostServer=new
   |                               |              |
   |<-- BATTLE_RESTORED -----------|              |
```

### 6. Match Decline Flow

This flow handles a race condition (TOCTOU - Time Of Check To Time Of Use) where a player leaves the queue but still receives a `MATCH_FOUND` event. This can occur because:

1. Player clicks "Leave Queue"
2. Server processes `LEAVE_QUEUE`, clears their queue status
3. Meanwhile, matchmaking has already popped both players and created a battle
4. Player receives `MATCH_FOUND` for a battle they didn't want

**Solution:** The client tracks its "in queue" state. If it receives `MATCH_FOUND` but is no longer in queue, it sends `DECLINE_MATCH` to cancel the battle gracefully.

```
Client A      Client B      Server                    Redis
   |             |            |                          |
   |-- LEAVE_QUEUE --------->|                          |
   |             |            |-- Clear queue status --->|
   |             |            |                          |
   |<- QUEUE_LEFT ------------|                          |
   |             |            |                          |
   |             |            | (Match already created)  |
   |             |            |                          |
   |<-- MATCH_FOUND ---------|                          |
   |             |<-- MATCH_FOUND ----------------------|
   |             |            |                          |
   | (Not in queue!)          |                          |
   |             |            |                          |
   |-- DECLINE_MATCH ------->|                          |
   |   {battleId}             |                          |
   |             |            |                          |
   |             |            |-- cancelBattle()         |
   |             |            |   - Clear timers         |
   |             |            |   - Clear user battles   |
   |             |            |   - Cleanup Redis ------>|
   |             |            |                          |
   |             |<-- MATCH_CANCELLED ------------------|
   |             |   {battleId, reason}                  |
   |             |            |                          |
   |             |            |-- Re-queue opponent ---->|
   |             |            |                          |
   |             |<-- QUEUE_JOINED ---------------------|
```

**Key Points:**

- `cancelBattle()` differs from `forfeit()`: no winner is declared, no `BATTLE_END` event is published, and no replay TTL is set
- The opponent is automatically re-queued so they don't lose their place
- Rate limited: 5 requests per minute to prevent abuse
- Only the player who received `MATCH_FOUND` after leaving can decline (verified via battle participant check)

**Client Implementation Requirements:**

```typescript
// Track queue state locally
let isInQueue = false;

socket.on('QUEUE_JOINED', () => {
  isInQueue = true;
});
socket.on('QUEUE_LEFT', () => {
  isInQueue = false;
});

socket.on('MATCH_FOUND', ({ battleId, opponent }) => {
  if (!isInQueue) {
    // We left the queue but got matched anyway - decline
    socket.emit('DECLINE_MATCH', { battleId });
    return;
  }
  // Normal match handling...
});

socket.on('MATCH_CANCELLED', ({ battleId, reason }) => {
  showNotification('Opponent declined, finding new match...');
  // UI will update when QUEUE_JOINED is received
});
```

---

## Battle Engine Integration

### @pkmn/sim Usage

The battle system uses Pokemon Showdown's `@pkmn/sim` package for battle simulation:

```typescript
import { BattleStreams } from '@pkmn/sim';

// Create battle stream
const stream = new BattleStreams.BattleStream();
const streams = BattleStreams.getPlayerStreams(stream);

// Initialize battle
await streams.omniscient.write(
  `>start ${JSON.stringify({ formatid: 'gen9ou', seed })}\n` +
    `>player p1 ${JSON.stringify({ name: 'Player1', team: packedTeam1 })}\n` +
    `>player p2 ${JSON.stringify({ name: 'Player2', team: packedTeam2 })}`
);

// Process moves
await streams.omniscient.write('>p1 move 1');
await streams.omniscient.write('>p2 move 2');

// Read output
for await (const chunk of streams.omniscient) {
  // Battle state updates in Pokemon Showdown protocol
}
```

### Team Packing

Teams are converted to Pokemon Showdown's packed format using `@pokehub/shared/pokemon-showdown-validation`:

```typescript
import { packTeam } from '@pokehub/shared/pokemon-showdown-validation';

const packedTeam = packTeam(team.pokemon);
// e.g., "Pikachu||lightball|static|thunderbolt,voltswitch,...|..."
```

### Random Team Generation

Random battle formats use `@pkmn/randoms` to generate teams server-side. This logic is isolated in `random-team-generator.ts` (separate from `team-validator-showdown.ts`) to avoid pulling `@pkmn/randoms` into the team builder bundle.

```typescript
import { isRandomFormat, generateRandomTeam } from '@pokehub/shared/pokemon-showdown-validation';

if (isRandomFormat('gen9randombattle')) {
  const packedTeam = generateRandomTeam('gen9randombattle');
  // Team generated and packed in one step
}
```

The gateway branches on `teamId` presence:
- **With `teamId`** (competitive): fetch team from DB, validate ownership, pack
- **Without `teamId`** (random): validate `isRandomFormat()`, generate via `@pkmn/randoms`, use `teamId = 'random'` sentinel

Random teams are generated at **queue join time**, so the generated team persists through requeue-on-decline without any additional handling.

### Auto-Move on Timeout

When a player times out, the system uses Pokemon Showdown's built-in auto-choice:

```typescript
const battle = instance.stream.battle;
const side = battle.sides[playerIndex];
side.autoChoose();
const choice = side.getChoice();
```

---

## Error Handling

### Client Errors

| Code                | Cause                   | Client Action             |
| ------------------- | ----------------------- | ------------------------- |
| `INVALID_INPUT`     | Malformed request       | Display validation errors |
| `TEAM_NOT_FOUND`    | Team doesn't exist      | Prompt team selection     |
| `INVALID_TEAM`      | Team ownership mismatch | Prompt team selection     |
| `TEAM_REQUIRED`     | Non-random format without teamId | Prompt team selection  |
| `QUEUE_ERROR`       | Queue join failed       | Retry or show error       |
| `ALREADY_IN_BATTLE` | User in another battle  | Show rejoin option        |
| `ALREADY_IN_QUEUE`  | User already queued     | Show queue status         |

### Battle Errors

| Code                    | Cause               | Client Action      |
| ----------------------- | ------------------- | ------------------ |
| `MOVE_ERROR`            | Invalid move        | Show valid moves   |
| `FORFEIT_ERROR`         | Forfeit failed      | Retry              |
| `REJOIN_ERROR`          | Reconnect failed    | Clear battle state |
| `BATTLE_NOT_FOUND`      | Invalid battleId    | Clear local state  |
| `MAX_REPLAYS_REACHED`   | User has 10 replays | Prompt deletion    |
| `REPLAY_WINDOW_EXPIRED` | >1 hour since end   | Cannot save        |

---

## Configuration

### Environment Variables

```bash
# Redis (Local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# Redis (Production - Azure Cache)
REDIS_HOST=pokehub-cache.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=<primary-access-key>
REDIS_TLS=true
```

### Docker Compose (Development)

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - 6379:6379
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  redis-commander:
    image: rediscommander/redis-commander:latest
    ports:
      - 8081:8081
    environment:
      REDIS_HOSTS: local:redis:6379
```

---

## Implementation Status

| Component                      | Status  | Notes                                      |
| ------------------------------ | ------- | ------------------------------------------ |
| `pokemon-battle-types` package | Done    | Shared types, DTOs, Zod schemas            |
| `pokehub-redis` package        | Done    | Full Redis service                         |
| `pokehub-battles-db` package   | Done    | Replay persistence                         |
| Docker Compose Redis           | Done    | Local development                          |
| API configuration              | Done    | Redis config integration                   |
| BattleGateway                  | Done    | WebSocket handling, resource cleanup       |
| BattleManagerService           | Done    | Battle lifecycle, per-battle locking       |
| MatchmakingService             | Done    | FIFO queue matching                        |
| BattlePersistenceService       | Done    | Replay save/delete                         |
| TurnTimerService               | Done    | Warning + timeout                          |
| WsJwtGuard                     | Done    | WebSocket auth                             |
| Database migration             | Done    | `battle_replays` table                     |
| Concurrency protection         | Done    | Battle locks, timeout cleanup              |
| Zod validation                 | Done    | Runtime validation for all WS handlers     |
| WebSocket rate limiting        | Done    | Per-event throttling via @nestjs/throttler |
| Match decline flow             | Done    | TOCTOU race condition fix                  |
| Random battles                 | Done    | Random team gen, tabbed lobby UI           |
| Frontend battle UI             | Pending | Socket.io client, battle UI                |
| Rating system                  | Future  | See `rating-matchmaking-system.md`         |

---

## Concurrency & Resource Management

### Battle Locking

The `BattleManagerService` uses per-battle locks to serialize state-changing operations and prevent race conditions. This is implemented via an in-memory lock map since battles are hosted on a single server.

**Protected Operations:**

| Operation             | Potential Conflicts                                  |
| --------------------- | ---------------------------------------------------- |
| `processChoice()`     | Simultaneous moves from both players, timeout firing |
| `forfeit()`           | Player submits move while forfeiting                 |
| `handleTurnTimeout()` | Timeout fires while player submits move or forfeits  |

**Implementation:**

```typescript
// Map of battle ID -> lock promise
private readonly battleLocks = new Map<string, Promise<void>>();

private async withBattleLock<T>(battleId: string, fn: () => Promise<T>): Promise<T> {
  // Wait for any pending operation on this battle
  while (this.battleLocks.has(battleId)) {
    await this.battleLocks.get(battleId);
  }

  // Create a lock
  let unlock!: () => void;
  const lock = new Promise<void>((resolve) => { unlock = resolve; });
  this.battleLocks.set(battleId, lock);

  try {
    return await fn();
  } finally {
    this.battleLocks.delete(battleId);
    unlock();
  }
}
```

**Note:** If multi-server battle hosting is ever needed, this should be replaced with Redis Lua scripts for distributed locking.

### Disconnect Timeout Management

When a player disconnects, a 2-minute timeout is scheduled. These timeouts are tracked and properly cleaned up:

```typescript
// Map of "battleId:playerId" -> timeout handle
private readonly disconnectTimeouts = new Map<string, NodeJS.Timeout>();
```

**Cleanup Scenarios:**

| Scenario                        | Action                                                            |
| ------------------------------- | ----------------------------------------------------------------- |
| Player reconnects (same server) | Timeout cleared via `clearDisconnectTimeout()`                    |
| Player reconnects (diff server) | Timeout fires but Redis flag check prevents forfeit               |
| Battle ends                     | All battle timeouts cleared via `clearBattleDisconnectTimeouts()` |

### Gateway Resource Cleanup

The `BattleGateway` implements `OnModuleDestroy` to properly clean up resources on shutdown:

```typescript
async onModuleDestroy(): Promise<void> {
  // Clear heartbeat interval
  if (this.heartbeatInterval) {
    clearInterval(this.heartbeatInterval);
  }
  // Disconnect Redis subscriber
  if (this.redisSubscriber) {
    await this.redisSubscriber.disconnect();
  }
}
```

**Tracked Resources:**

- Server heartbeat interval (5-second refresh)
- Redis subscriber client (per-gateway)
- Per-battle Redis channel subscriptions (cleaned up on battle end)

### Zod Validation on WebSocket Handlers

All WebSocket event handlers validate payloads using Zod schemas from `@pokehub/shared/pokemon-battle-types`:

| Handler              | Schema                  |
| -------------------- | ----------------------- |
| `handleJoinQueue`    | `JoinQueueDTOSchema`    |
| `handleMove`         | `BattleMoveDTOSchema`   |
| `handleForfeit`      | `ForfeitDTOSchema`      |
| `handleRejoin`       | `RejoinDTOSchema`       |
| `handleSaveReplay`   | `SaveReplayDTOSchema`   |
| `handleDeclineMatch` | `DeclineMatchDTOSchema` |

This provides runtime validation in addition to TypeScript's compile-time type checking.

### WebSocket Rate Limiting

The battle gateway uses `@nestjs/throttler` to protect against spam and abuse. Rate limiting is applied at the application level since infrastructure load balancers only limit WebSocket connection handshakes, not individual messages.

**Implementation:**

```typescript
// Custom guard extends ThrottlerGuard for WebSocket context
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, throttler } = requestProps;
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    const handler = context.getHandler();

    // Use authenticated user ID, fall back to socket address
    const tracker = client.data?.user?.userId ?? client.conn.remoteAddress;
    const eventName = handler.name;
    const key = `${this.generateKey(context, tracker, throttler.name)}:${eventName}`;
    // ... rate check logic
  }
}

// Per-handler rate limits via decorator
@WsThrottle(2, 1000)  // 2 requests per second
@SubscribeMessage(BATTLE_EVENT.MOVE)
async handleMove(...) { }
```

**Rate Limits by Event:**

| Event           | Limit | Window | Rationale                          |
| --------------- | ----- | ------ | ---------------------------------- |
| `JOIN_QUEUE`    | 10    | 60s    | Prevent queue manipulation         |
| `LEAVE_QUEUE`   | 10    | 60s    | Prevent queue manipulation         |
| `MOVE`          | 2     | 1s     | Prevent spam clicking during turns |
| `FORFEIT`       | 1     | 5s     | Prevent accidental double-forfeit  |
| `REJOIN`        | 5     | 60s    | Prevent reconnection spam          |
| `SAVE_REPLAY`   | 5     | 60s    | Prevent save button spam           |
| `DECLINE_MATCH` | 5     | 60s    | Prevent decline spam               |

**Key Design Decisions:**

- **Per-user-per-event keys**: Rate limits are tracked separately for each user and event type, so queue limits don't affect move limits
- **User ID tracking**: Authenticated users are tracked by user ID (not IP), preventing issues with shared IPs
- **In-memory storage**: Uses `ThrottlerModule`'s default in-memory storage, which is appropriate since battles are hosted on a single server
- **Structured error response**: When rate limited, clients receive an `ERROR` event with code `RATE_LIMITED`

**Client Error Handling:**

```typescript
socket.on('ERROR', (payload) => {
  if (payload.code === 'RATE_LIMITED') {
    // Show "Too many requests, please wait" message
  }
});
```

---

## Future Enhancements

See `docs/plans/rating-matchmaking-system.md` for planned rating and matchmaking improvements:

- Glicko-1 rating system with rating deviation
- GXE (Glicko X-Act Estimate) and COIL metrics
- Rating-based matchmaking with expanding search range
- Leaderboards and ladder system
- Seasonal resets

---

## Related Documentation

- `docs/plans/rating-matchmaking-system.md` - Rating system design
- `docs/deployment/` - Azure deployment (Redis, Container Apps, CI/CD)
- `docs/development/backend-system.md` - Backend architecture
- `docs/features/team-builder.md` - Team creation for battles
