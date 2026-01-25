# Battle Backend Infrastructure Plan

## Overview

This document describes the implementation plan for a real-time Pokemon battle system using WebSockets, Redis, and the @pkmn/sim battle engine. The system supports multiple API server instances, crash recovery, and matchmaking.

## Current State

- **No battle system exists** - The app has team building but no battling
- **No Redis** - Currently only PostgreSQL is used
- **No WebSockets** - API is REST-only
- **@pkmn/sim is installed** - Battle engine is available but unused

## Goals

- Enable real-time Pokemon battles between users
- Support horizontal scaling (multiple API instances)
- Handle disconnects gracefully with reconnection support
- Recover battles if a server crashes
- Persist completed battles for history/replays

## Confirmed Decisions

| Decision          | Choice                                   | Rationale                                    |
| ----------------- | ---------------------------------------- | -------------------------------------------- |
| Crash Recovery    | Full recovery via input log replay       | @pkmn/sim is deterministic with same seed    |
| Team Requirement  | Always require teamId                    | Simplifies MVP, no random team generation    |
| Turn Timer        | Warning at 30s → auto-random-move at 60s | Prevents stalling without harsh forfeit      |
| Redis Tier        | Azure Cache Basic C0 ($16/mo)            | Full functionality, upgrade path to Standard |
| Redis Unavailable | Fail queue joins (safer)                 | Don't allow degraded battles                 |
| Battle Formats    | Support multiple formats                 | gen9ou, gen9uu, etc. from start              |

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   Client    │     │   Client    │
│  (Browser)  │     │  (Browser)  │     │  (Browser)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │ WebSocket         │ WebSocket         │ WebSocket
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│              Load Balancer (Azure)                  │
└─────────────────────────────────────────────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ API Server 1│     │ API Server 2│     │ API Server N│
│  (NestJS)   │◄───►│  (NestJS)   │◄───►│  (NestJS)   │
│             │     │             │     │             │
│ BattleStream│     │ BattleStream│     │ BattleStream│
│ (in-memory) │     │ (in-memory) │     │ (in-memory) │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │     Redis (Azure)       │
              │  - Pub/Sub messaging    │
              │  - Battle input logs    │
              │  - Matchmaking queues   │
              │  - User battle tracking │
              └───────────┬─────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │   PostgreSQL (Supabase) │
              │  - Completed battles    │
              │  - Battle history       │
              │  - Replay data          │
              └─────────────────────────┘
```

---

## Communication Flow Diagrams

### 1. Matchmaking Flow

```
┌──────────┐         ┌──────────────┐         ┌─────────┐         ┌──────────────┐
│  Client  │         │ API Server 1 │         │  Redis  │         │ API Server 2 │
└────┬─────┘         └──────┬───────┘         └────┬────┘         └──────┬───────┘
     │                      │                      │                      │
     │  WS Connect + JWT    │                      │                      │
     │─────────────────────>│                      │                      │
     │                      │                      │                      │
     │  JOIN_QUEUE          │                      │                      │
     │  {format, teamId}    │                      │                      │
     │─────────────────────>│                      │                      │
     │                      │                      │                      │
     │                      │  LPUSH queue:gen9ou  │                      │
     │                      │  {userId, teamId}    │                      │
     │                      │─────────────────────>│                      │
     │                      │                      │                      │
     │                      │  SET user:123:queue  │                      │
     │                      │  "gen9ou"            │                      │
     │                      │─────────────────────>│                      │
     │                      │                      │                      │
     │  QUEUE_JOINED        │                      │                      │
     │  {position: 1}       │                      │                      │
     │<─────────────────────│                      │                      │
     │                      │                      │                      │
     │                      │                      │  LPUSH queue:gen9ou  │
     │                      │                      │<─────────────────────│
     │                      │                      │  (Player 2 joins)    │
     │                      │                      │                      │
     │                      │                      │  LLEN queue:gen9ou   │
     │                      │                      │<─────────────────────│
     │                      │                      │  returns 2           │
     │                      │                      │─────────────────────>│
     │                      │                      │                      │
     │                      │                      │  LPOP x2 (atomic)    │
     │                      │                      │<─────────────────────│
     │                      │                      │  returns both players│
     │                      │                      │─────────────────────>│
     │                      │                      │                      │
     │                      │                      │  Create battle keys  │
     │                      │                      │<─────────────────────│
     │                      │                      │                      │
     │                      │  PUB match:user123   │                      │
     │                      │<─────────────────────│─────────────────────>│
     │                      │  {battleId, opponent}│                      │
     │                      │                      │                      │
     │  MATCH_FOUND         │                      │                      │
     │  {battleId, opponent}│                      │                      │
     │<─────────────────────│                      │                      │
     │                      │                      │                      │
     │  BATTLE_START        │                      │                      │
     │  {battleId, state}   │                      │                      │
     │<─────────────────────│                      │                      │
     │                      │                      │                      │
```

### 2. Battle Turn Flow

```
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌─────────────┐
│ Player 1 │  │ Player 2 │  │  API Server  │  │  Redis  │  │ @pkmn/sim   │
└────┬─────┘  └────┬─────┘  └──────┬───────┘  └────┬────┘  └──────┬──────┘
     │             │               │               │               │
     │  MOVE       │               │               │               │
     │  {choice:   │               │               │               │
     │   "move 1"} │               │               │               │
     │────────────────────────────>│               │               │
     │             │               │               │               │
     │             │               │  HSET battle:abc123           │
     │             │               │  pending '{"p1":"move 1"}'    │
     │             │               │──────────────>│               │
     │             │               │               │               │
     │             │  MOVE         │               │               │
     │             │  {choice:     │               │               │
     │             │   "move 2"}   │               │               │
     │             │──────────────>│               │               │
     │             │               │               │               │
     │             │               │  Both choices received        │
     │             │               │               │               │
     │             │               │  RPUSH battle:abc123:log      │
     │             │               │  ">p1 move 1", ">p2 move 2"   │
     │             │               │──────────────>│               │
     │             │               │               │               │
     │             │               │  stream.write(">p1 move 1")   │
     │             │               │──────────────────────────────>│
     │             │               │  stream.write(">p2 move 2")   │
     │             │               │──────────────────────────────>│
     │             │               │               │               │
     │             │               │  Battle events (damage, etc)  │
     │             │               │<──────────────────────────────│
     │             │               │               │               │
     │             │               │  HSET pending '{}'            │
     │             │               │──────────────>│               │
     │             │               │               │               │
     │  BATTLE_UPDATE              │               │               │
     │  {turn results}             │               │               │
     │<────────────────────────────│               │               │
     │             │               │               │               │
     │             │  BATTLE_UPDATE│               │               │
     │             │  {turn results}               │               │
     │             │<──────────────│               │               │
     │             │               │               │               │
     │             │               │  Reset turn timer             │
     │             │               │               │               │
```

### 3. Turn Timer Flow

```
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────────┐
│ Player 1 │  │ Player 2 │  │  API Server  │  │ @pkmn/sim   │
└────┬─────┘  └────┬─────┘  └──────┬───────┘  └──────┬──────┘
     │             │               │                  │
     │  MOVE       │               │                  │
     │  "move 1"   │               │                  │
     │────────────────────────────>│                  │
     │             │               │                  │
     │             │               │  Start 60s timer │
     │             │               │  for Player 2    │
     │             │               │                  │
     │             │   ... 30 seconds pass ...        │
     │             │               │                  │
     │             │  TURN_WARNING │                  │
     │             │  {seconds: 30}│                  │
     │             │<──────────────│                  │
     │             │               │                  │
     │             │   ... 30 more seconds pass ...   │
     │             │               │                  │
     │             │               │  Timer expires!  │
     │             │               │                  │
     │             │               │  Get valid moves │
     │             │               │  for Player 2    │
     │             │               │                  │
     │             │               │  Select random   │
     │             │               │  valid move      │
     │             │               │                  │
     │             │               │  Process as if   │
     │             │               │  Player 2 chose  │
     │             │               │─────────────────>│
     │             │               │                  │
     │  BATTLE_UPDATE              │                  │
     │  {turn results,             │                  │
     │   autoMove: true}           │                  │
     │<────────────────────────────│                  │
     │             │               │                  │
     │             │  BATTLE_UPDATE│                  │
     │             │  {turn results│                  │
     │             │   autoMove: true}                │
     │             │<──────────────│                  │
     │             │               │                  │
```

### 4. Battle End Flow

```
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌────────────┐
│ Player 1 │  │ Player 2 │  │  API Server  │  │  Redis  │  │ PostgreSQL │
└────┬─────┘  └────┬─────┘  └──────┬───────┘  └────┬────┘  └─────┬──────┘
     │             │               │               │              │
     │             │               │  @pkmn/sim    │              │
     │             │               │  emits "win"  │              │
     │             │               │               │              │
     │             │               │  GET battle:abc123:log       │
     │             │               │──────────────>│              │
     │             │               │  [all commands]              │
     │             │               │<──────────────│              │
     │             │               │               │              │
     │             │               │  INSERT INTO battles         │
     │             │               │  (log, winner, status)       │
     │             │               │─────────────────────────────>│
     │             │               │               │              │
     │             │               │  DEL battle:abc123           │
     │             │               │  DEL battle:abc123:log       │
     │             │               │  DEL battle:abc123:seed      │
     │             │               │  DEL user:p1:battle          │
     │             │               │  DEL user:p2:battle          │
     │             │               │──────────────>│              │
     │             │               │               │              │
     │  BATTLE_END                 │               │              │
     │  {winner: "p1",             │               │              │
     │   reason: "win"}            │               │              │
     │<────────────────────────────│               │              │
     │             │               │               │              │
     │             │  BATTLE_END   │               │              │
     │             │  {winner: "p1"│               │              │
     │             │   reason:"win"}               │              │
     │             │<──────────────│               │              │
     │             │               │               │              │
```

### 5. Forfeit Flow

```
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌────────────┐
│ Player 1 │  │ Player 2 │  │  API Server  │  │  Redis  │  │ PostgreSQL │
└────┬─────┘  └────┬─────┘  └──────┬───────┘  └────┬────┘  └─────┬──────┘
     │             │               │               │              │
     │  FORFEIT    │               │               │              │
     │  {battleId} │               │               │              │
     │────────────────────────────>│               │              │
     │             │               │               │              │
     │             │               │  RPUSH battle:abc123:log     │
     │             │               │  ">forcewin p2"              │
     │             │               │──────────────>│              │
     │             │               │               │              │
     │             │               │  stream.write(">forcewin p2")│
     │             │               │               │              │
     │             │               │  ... same as Battle End ...  │
     │             │               │               │              │
     │  BATTLE_END                 │               │              │
     │  {winner: "p2",             │               │              │
     │   reason: "forfeit"}        │               │              │
     │<────────────────────────────│               │              │
     │             │               │               │              │
     │             │  BATTLE_END   │               │              │
     │             │  {winner:"p2",│               │              │
     │             │  reason:      │               │              │
     │             │  "opponent_   │               │              │
     │             │   forfeit"}   │               │              │
     │             │<──────────────│               │              │
     │             │               │               │              │
```

### 6. Disconnect & Reconnect Flow

```
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────┐
│ Player 1 │  │ Player 2 │  │  API Server  │  │  Redis  │
└────┬─────┘  └────┬─────┘  └──────┬───────┘  └────┬────┘
     │             │               │               │
     │  Connection │               │               │
     │  Lost!      │               │               │
     │──────X      │               │               │
     │             │               │               │
     │             │               │  handleDisconnect()
     │             │               │               │
     │             │               │  HSET battle:abc123
     │             │               │  p1Disconnected: true
     │             │               │  p1DisconnectTime: now
     │             │               │──────────────>│
     │             │               │               │
     │             │               │  Start 60s    │
     │             │               │  reconnect    │
     │             │               │  timer        │
     │             │               │               │
     │             │  OPPONENT_    │               │
     │             │  DISCONNECTED │               │
     │             │  {timeout: 60}│               │
     │             │<──────────────│               │
     │             │               │               │
     │  ... 15 seconds later ...   │               │
     │             │               │               │
     │  WS Reconnect               │               │
     │  + JWT      │               │               │
     │────────────────────────────>│               │
     │             │               │               │
     │             │               │  GET user:p1:battle
     │             │               │──────────────>│
     │             │               │  "abc123"     │
     │             │               │<──────────────│
     │             │               │               │
     │             │               │  Battle exists in memory?
     │             │               │  YES → restore connection
     │             │               │               │
     │             │               │  HSET battle:abc123
     │             │               │  p1Disconnected: false
     │             │               │──────────────>│
     │             │               │               │
     │             │               │  Cancel 60s timer
     │             │               │               │
     │  BATTLE_RESTORED            │               │
     │  {battleId,                 │               │
     │   currentState}             │               │
     │<────────────────────────────│               │
     │             │               │               │
     │             │  OPPONENT_    │               │
     │             │  RECONNECTED  │               │
     │             │<──────────────│               │
     │             │               │               │
```

### 7. Crash Recovery Flow (Server Dies)

```
┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐
│ Player 1 │  │ API Server 1 │  │ API Server 2 │  │  Redis  │
└────┬─────┘  │   (CRASHED)  │  └──────┬───────┘  └────┬────┘
     │        └──────────────┘         │               │
     │                                 │               │
     │  Connection Lost!               │               │
     │  (Server 1 crashed)             │               │
     │                                 │               │
     │  ... Reconnecting ...           │               │
     │                                 │               │
     │  WS Connect + JWT               │               │
     │  (Load balancer → Server 2)     │               │
     │────────────────────────────────>│               │
     │                                 │               │
     │                                 │  GET user:p1:battle
     │                                 │──────────────>│
     │                                 │  "abc123"     │
     │                                 │<──────────────│
     │                                 │               │
     │                                 │  HGETALL battle:abc123
     │                                 │──────────────>│
     │                                 │  {hostServer: "server1",
     │                                 │   status: "active"}
     │                                 │<──────────────│
     │                                 │               │
     │                                 │  Check server1 heartbeat
     │                                 │  GET server:server1:heartbeat
     │                                 │──────────────>│
     │                                 │  NULL (expired = dead)
     │                                 │<──────────────│
     │                                 │               │
     │                                 │  ADOPT BATTLE │
     │                                 │               │
     │                                 │  GET battle:abc123:seed
     │                                 │──────────────>│
     │                                 │  "1234,5678,9012,3456"
     │                                 │<──────────────│
     │                                 │               │
     │                                 │  LRANGE battle:abc123:log 0 -1
     │                                 │──────────────>│
     │                                 │  [">start...", ">player p1...",
     │                                 │   ">player p2...", ">p1 move 1",
     │                                 │   ">p2 move 2", ...]
     │                                 │<──────────────│
     │                                 │               │
     │                                 │  Create new BattleStream
     │                                 │  Replay all commands
     │                                 │  (~10-50ms for 50 turns)
     │                                 │               │
     │                                 │  HSET battle:abc123
     │                                 │  hostServer: "server2"
     │                                 │──────────────>│
     │                                 │               │
     │                                 │  SADD server:server2:battles
     │                                 │  "abc123"
     │                                 │──────────────>│
     │                                 │               │
     │  BATTLE_RESTORED                │               │
     │  {battleId: "abc123",           │               │
     │   currentState: "...",          │               │
     │   message: "Battle recovered"}  │               │
     │<────────────────────────────────│               │
     │                                 │               │
```

### 8. Disconnect Timeout (Auto-Forfeit) Flow

```
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌────────────┐
│ Player 1 │  │ Player 2 │  │  API Server  │  │  Redis  │  │ PostgreSQL │
└────┬─────┘  └────┬─────┘  └──────┬───────┘  └────┬────┘  └─────┬──────┘
     │             │               │               │              │
     │  Connection │               │               │              │
     │  Lost!      │               │               │              │
     │──────X      │               │               │              │
     │             │               │               │              │
     │             │  OPPONENT_    │               │              │
     │             │  DISCONNECTED │               │              │
     │             │  {timeout: 60}│               │              │
     │             │<──────────────│               │              │
     │             │               │               │              │
     │             │               │  Start 60s    │              │
     │             │               │  timer        │              │
     │             │               │               │              │
     │  ... 60 seconds pass, Player 1 never reconnects ...       │
     │             │               │               │              │
     │             │               │  Timer fires! │              │
     │             │               │               │              │
     │             │               │  Auto-forfeit │              │
     │             │               │  Player 1     │              │
     │             │               │               │              │
     │             │               │  RPUSH ">forcewin p2"        │
     │             │               │──────────────>│              │
     │             │               │               │              │
     │             │               │  Save to PostgreSQL          │
     │             │               │─────────────────────────────>│
     │             │               │               │              │
     │             │               │  Cleanup Redis keys          │
     │             │               │──────────────>│              │
     │             │               │               │              │
     │             │  BATTLE_END   │               │              │
     │             │  {winner:"p2",│               │              │
     │             │   reason:     │               │              │
     │             │   "opponent_  │               │              │
     │             │    timeout"}  │               │              │
     │             │<──────────────│               │              │
     │             │               │               │              │
```

### 9. Multi-Server Battle Flow (Players on Different Servers)

```
┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌──────────────┐  ┌──────────┐
│ Player 1 │  │ API Server 1 │  │  Redis  │  │ API Server 2 │  │ Player 2 │
└────┬─────┘  └──────┬───────┘  └────┬────┘  └──────┬───────┘  └────┬─────┘
     │               │               │               │               │
     │  Connected    │               │               │   Connected   │
     │──────────────>│               │               │<──────────────│
     │               │               │               │               │
     │               │  Battle abc123 hosted on Server 1             │
     │               │               │               │               │
     │  MOVE         │               │               │               │
     │  "move 1"     │               │               │               │
     │──────────────>│               │               │               │
     │               │               │               │               │
     │               │  Store pending choice        │               │
     │               │──────────────>│               │               │
     │               │               │               │               │
     │               │               │               │  MOVE         │
     │               │               │               │  "move 2"     │
     │               │               │               │<──────────────│
     │               │               │               │               │
     │               │               │  PUB battle:abc123:move       │
     │               │               │  {player: "p2", choice: "move 2"}
     │               │               │<──────────────│               │
     │               │               │               │               │
     │               │  SUB receives │               │               │
     │               │  p2's move    │               │               │
     │               │<──────────────│               │               │
     │               │               │               │               │
     │               │  Process turn │               │               │
     │               │  (both moves) │               │               │
     │               │               │               │               │
     │               │  PUB battle:abc123:update                     │
     │               │  {turn results}                               │
     │               │──────────────>│──────────────>│               │
     │               │               │               │               │
     │  BATTLE_UPDATE│               │               │  BATTLE_UPDATE│
     │<──────────────│               │               │──────────────>│
     │               │               │               │               │
```

---

## Infrastructure Setup

### Local Development (Docker Compose)

Add to `docker-compose.dev.yaml`:

```yaml
services:
  # ... existing postgresdb service ...

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - 6379:6379
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  redis-commander:
    image: rediscommander/redis-commander:latest
    restart: always
    environment:
      REDIS_HOSTS: local:redis:6379
    ports:
      - 8081:8081
    depends_on:
      - redis

volumes:
  redis_data:
```

**Local environment variables:**

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false
```

### Production (Azure Cache for Redis)

**Provision Azure Cache:**

```bash
az redis create \
  --name pokehub-cache \
  --resource-group pokehub_group \
  --location eastus \
  --sku Basic \
  --vm-size c0

az redis list-keys \
  --name pokehub-cache \
  --resource-group pokehub_group
```

**Production environment variables:**

```bash
REDIS_HOST=pokehub-cache.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=<primary-access-key>
REDIS_TLS=true
```

**Update `pokehub-api.yaml`:**

```yaml
properties:
  configuration:
    secrets:
      - name: redis-password
        value: REPLACE_WITH_REDIS_PASSWORD

  template:
    containers:
      - name: pokehub-api
        env:
          - name: REDIS_HOST
            value: pokehub-cache.redis.cache.windows.net
          - name: REDIS_PORT
            value: '6380'
          - name: REDIS_PASSWORD
            secretRef: redis-password
          - name: REDIS_TLS
            value: 'true'
```

**Update `deploy.sh`:**

```bash
sed -i "s|REPLACE_WITH_REDIS_PASSWORD|${REDIS_PASSWORD}|g" "$TEMP_FILE"
```

---

## New Packages

### 1. `packages/backend/pokehub-redis/`

Redis connection module with interface-based DI.

```
packages/backend/pokehub-redis/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── pokehub-redis.module.ts
│       ├── redis.service.ts
│       ├── redis.service.interface.ts
│       ├── redis.service.provider.ts
│       └── redis.config.ts
├── project.json
├── tsconfig.json
├── tsconfig.lib.json
└── jest.config.ts
```

**Interface:**

```typescript
export const REDIS_SERVICE = 'REDIS_SERVICE';

export interface IRedisService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  lpush(key: string, ...values: string[]): Promise<number>;
  rpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  hset(key: string, field: string, value: string): Promise<void>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  expire(key: string, seconds: number): Promise<boolean>;
  getClient(): Redis;
  getDuplicateClient(): Redis;
  ping(): Promise<boolean>;
}
```

### 2. `packages/shared/pokemon-battle-types/`

Shared TypeScript types for battle system.

```
packages/shared/pokemon-battle-types/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── battle-config.ts
│       ├── battle-state.ts
│       ├── client-events.ts
│       ├── server-events.ts
│       └── errors.ts
├── project.json
├── tsconfig.json
└── tsconfig.lib.json
```

**Key types:**

```typescript
export interface BattleConfig {
  id: string;
  format: string;
  player1: { id: string; name: string; teamId: string };
  player2: { id: string; name: string; teamId: string };
  seed: string;
}

export type ClientBattleEvent =
  | { type: 'JOIN_QUEUE'; format: string; teamId: string }
  | { type: 'LEAVE_QUEUE' }
  | { type: 'MOVE'; battleId: string; choice: string }
  | { type: 'FORFEIT'; battleId: string }
  | { type: 'REJOIN'; battleId: string };

export type ServerBattleEvent =
  | { type: 'QUEUE_JOINED'; position: number }
  | { type: 'MATCH_FOUND'; battleId: string; opponent: string }
  | { type: 'BATTLE_START'; battleId: string; initialState: string }
  | { type: 'BATTLE_UPDATE'; battleId: string; data: string }
  | {
      type: 'BATTLE_END';
      battleId: string;
      winner: string | null;
      reason: string;
    }
  | { type: 'ERROR'; code: string; message: string; recoverable: boolean }
  | { type: 'TURN_WARNING'; battleId: string; secondsRemaining: number };
```

### 3. `packages/backend/pokehub-battles-db/`

Battle persistence with Drizzle ORM.

```
packages/backend/pokehub-battles-db/
├── src/
│   ├── index.ts
│   └── lib/
│       ├── pokehub-battles-db.module.ts
│       ├── schema.ts
│       ├── battles.repository.ts
│       ├── battles.repository.interface.ts
│       └── battles.repository.provider.ts
├── project.json
├── tsconfig.json
├── tsconfig.lib.json
└── jest.config.ts
```

**Schema:**

```typescript
export const battlesTable = pgTable('battles', {
  id: uuid('id').primaryKey().defaultRandom(),
  format: varchar('format', { length: 50 }).notNull(),
  player1Id: uuid('player1_id')
    .references(() => usersTable.id)
    .notNull(),
  player2Id: uuid('player2_id')
    .references(() => usersTable.id)
    .notNull(),
  player1TeamId: uuid('player1_team_id')
    .references(() => teamsTable.id)
    .notNull(),
  player2TeamId: uuid('player2_team_id')
    .references(() => teamsTable.id)
    .notNull(),
  winnerId: uuid('winner_id').references(() => usersTable.id),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  battleLog: jsonb('battle_log').$type<string[]>(),
  seed: varchar('seed', { length: 50 }).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
});
```

---

## Battle Module

### Structure

```
apps/pokehub-api/src/battle/
├── battle.module.ts
├── battle.gateway.ts
├── battle.controller.ts
├── services/
│   ├── battle-manager/
│   │   ├── battle-manager.service.ts
│   │   ├── battle-manager.service.interface.ts
│   │   └── battle-manager.service.provider.ts
│   ├── matchmaking/
│   │   ├── matchmaking.service.ts
│   │   ├── matchmaking.service.interface.ts
│   │   └── matchmaking.service.provider.ts
│   └── battle-persistence/
│       ├── battle-persistence.service.ts
│       ├── battle-persistence.service.interface.ts
│       └── battle-persistence.service.provider.ts
├── guards/
│   └── ws-jwt.guard.ts
├── adapters/
│   └── redis-io.adapter.ts
└── dto/
    ├── join-queue.dto.ts
    └── battle-move.dto.ts
```

### Service Interfaces

**IBattleManagerService:**

```typescript
export interface IBattleManagerService {
  createBattle(config: BattleConfig): Promise<ActiveBattle>;
  processChoice(
    battleId: string,
    playerId: string,
    choice: string
  ): Promise<void>;
  forfeit(battleId: string, playerId: string): Promise<void>;
  recoverBattle(battleId: string): Promise<ActiveBattle>;
  getBattle(battleId: string): ActiveBattle | undefined;
}
```

**IMatchmakingService:**

```typescript
export interface IMatchmakingService {
  joinQueue(userId: string, format: string, teamId: string): Promise<number>;
  leaveQueue(userId: string): Promise<void>;
  findMatch(
    format: string
  ): Promise<{ player1: QueueEntry; player2: QueueEntry } | null>;
}
```

**IBattlePersistenceService:**

```typescript
export interface IBattlePersistenceService {
  saveBattleStart(config: BattleConfig): Promise<void>;
  saveBattleEnd(
    battleId: string,
    winnerId: string | null,
    reason: string
  ): Promise<void>;
  getBattleHistory(
    userId: string,
    limit: number,
    offset: number
  ): Promise<BattleRecord[]>;
  getBattleReplay(battleId: string): Promise<string[] | null>;
}
```

### WebSocket Events

**Client → Server:**

| Event         | Payload                | Description                |
| ------------- | ---------------------- | -------------------------- |
| `JOIN_QUEUE`  | `{ format, teamId }`   | Join matchmaking queue     |
| `LEAVE_QUEUE` | `{}`                   | Leave queue                |
| `MOVE`        | `{ battleId, choice }` | Submit move/switch         |
| `FORFEIT`     | `{ battleId }`         | Forfeit battle             |
| `REJOIN`      | `{ battleId }`         | Reconnect to active battle |

**Server → Client:**

| Event           | Payload                          | Description        |
| --------------- | -------------------------------- | ------------------ |
| `QUEUE_JOINED`  | `{ position }`                   | Confirmed in queue |
| `MATCH_FOUND`   | `{ battleId, opponent }`         | Match made         |
| `BATTLE_START`  | `{ battleId, initialState }`     | Battle beginning   |
| `BATTLE_UPDATE` | `{ battleId, data }`             | Turn result        |
| `BATTLE_END`    | `{ battleId, winner, reason }`   | Battle over        |
| `TURN_WARNING`  | `{ battleId, secondsRemaining }` | Timer warning      |
| `ERROR`         | `{ code, message, recoverable }` | Error occurred     |

---

## Redis Data Model

```
# Battle metadata (hash)
battle:{battleId}
  - config: JSON string of BattleConfig
  - status: "active" | "completed" | "forfeited"
  - hostServer: server ID hosting this battle
  - pending: JSON of pending choices
  - p1Disconnected: "true" | "false"
  - p2Disconnected: "true" | "false"

# Battle seed (string)
battle:{battleId}:seed
  - PRNG seed for deterministic replay

# Battle input log (list, RPUSH to append)
battle:{battleId}:log
  - All input commands in order

# User's current battle (string)
user:{userId}:battle
  - Current active battleId

# User's queue status (string)
user:{userId}:queue
  - Format they're queued for

# Matchmaking queue (list per format)
queue:{format}
  - JSON entries: { userId, teamId, joinedAt }

# Server heartbeat (string with 10s TTL)
server:{serverId}:heartbeat
  - Timestamp, refreshed every 5s

# Battles hosted by server (set)
server:{serverId}:battles
  - Set of battleIds
```

---

## Error Handling

### Client-Side Errors

| Code                | Cause                  | Handling            |
| ------------------- | ---------------------- | ------------------- |
| `CONNECTION_FAILED` | Network issue          | Retry with backoff  |
| `AUTH_FAILED`       | Invalid JWT            | Redirect to login   |
| `INVALID_TEAM`      | Team validation failed | Return errors       |
| `ALREADY_IN_BATTLE` | User in another battle | Return battleId     |
| `ALREADY_IN_QUEUE`  | User already queued    | Return position     |
| `REDIS_UNAVAILABLE` | Redis down             | Reject with message |

### Battle Errors

| Code               | Cause                | Handling                 |
| ------------------ | -------------------- | ------------------------ |
| `INVALID_MOVE`     | Move not available   | Reject, request valid    |
| `NOT_YOUR_TURN`    | Out-of-order command | Ignore                   |
| `BATTLE_ENDED`     | Action after over    | Notify, send final state |
| `BATTLE_NOT_FOUND` | Invalid battleId     | Clear local state        |

---

## Configuration Updates

### `configuration.model.ts`

Add `RedisConfiguration` interface.

### `configuration.ts`

```typescript
redis: {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD || '',
  tls: process.env.REDIS_TLS === 'true',
},
```

### `app.module.ts`

Import `PokehubRedisModule` and `BattleModule`.

### `main.ts`

Configure Redis Socket.io adapter.

### `app.routes.ts`

Add battle routes.

---

## Implementation Order

| Step | Task                                  | Depends On      |
| ---- | ------------------------------------- | --------------- |
| 1    | Install npm dependencies              | -               |
| 2    | Update `docker-compose.dev.yaml`      | -               |
| 3    | Create `pokehub-redis` package        | Step 1          |
| 4    | Create `pokemon-battle-types` package | -               |
| 5    | Create `pokehub-battles-db` package   | -               |
| 6    | Generate Drizzle migration            | Step 5          |
| 7    | Update API configuration files        | Step 3          |
| 8    | Create battle module structure        | Steps 3, 4, 5   |
| 9    | Implement `BattleManagerService`      | Step 8          |
| 10   | Implement `MatchmakingService`        | Step 8          |
| 11   | Implement `BattlePersistenceService`  | Step 8          |
| 12   | Implement `BattleGateway`             | Steps 9, 10, 11 |
| 13   | Implement crash recovery              | Step 12         |
| 14   | Update deployment configs             | Step 3          |
| 15   | Write tests                           | All             |

---

## File Changes Summary

| Category             | Files to Create | Files to Modify                              |
| -------------------- | --------------- | -------------------------------------------- |
| Docker               | -               | `docker-compose.dev.yaml`                    |
| Deployment           | -               | `pokehub-api.yaml`, `deploy.sh`              |
| Redis Package        | ~7 files        | -                                            |
| Battle Types Package | ~6 files        | -                                            |
| Battles DB Package   | ~7 files        | -                                            |
| Battle Module        | ~15 files       | -                                            |
| Config               | -               | `configuration.ts`, `configuration.model.ts` |
| App Setup            | -               | `app.module.ts`, `main.ts`, `app.routes.ts`  |
| Migration            | 1 SQL file      | -                                            |

**Total: ~35 new files, ~8 modified files**

---

## Cost Impact

| Item                  | Current    | After          |
| --------------------- | ---------- | -------------- |
| Azure Container Apps  | ~$55-75/mo | ~$55-75/mo     |
| Azure Cache for Redis | $0         | +$16/mo        |
| **Total**             | ~$55-75/mo | **~$71-91/mo** |

---

## Success Criteria

- [ ] Redis package connects successfully (local & production)
- [ ] WebSocket connections authenticate via JWT
- [ ] Players can join matchmaking queue by format
- [ ] Matched players receive battle start event
- [ ] Moves are processed and both players receive updates
- [ ] Turn timer warns at 30s, auto-moves at 60s
- [ ] Forfeit ends battle correctly
- [ ] Disconnected player can reconnect within 60s
- [ ] Server crash doesn't lose battle state (recovery works)
- [ ] Completed battles are saved to PostgreSQL
- [ ] Battle history/replays are retrievable
- [ ] Multi-server: players on different servers can battle
