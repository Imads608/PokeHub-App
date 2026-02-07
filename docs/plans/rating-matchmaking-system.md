# Rating & Matchmaking System Plan

## Overview

This document describes the evolution from MVP matchmaking (simple FIFO queue) to a production-ready competitive rating system. The final rating algorithm (Elo vs Glicko) is TBD - this document covers both options.

## Current State (MVP)

### What Exists

- **Simple FIFO Queue**: First two players in the same format queue get matched
- **No Rating**: All players treated equally
- **No Ping/Region**: Single server, no latency consideration
- **Redis Lists**: `queue:{format}` stores queue entries

### MVP Queue Entry

```typescript
interface QueueEntry {
  userId: string;
  teamId: string;
  joinedAt: number;
}
```

### MVP Matchmaking Flow

```
Player A joins gen9ou queue → LPUSH queue:gen9ou
Player B joins gen9ou queue → LPUSH queue:gen9ou
                            → LLEN >= 2? Pop both → Create battle
```

---

## Target State (Phase 2+)

### Rating System Options

The rating algorithm is TBD. Here are the two main options:

#### Option A: Elo

Simple, well-understood system.

| Pros                     | Cons                                        |
| ------------------------ | ------------------------------------------- |
| Simple to implement      | No uncertainty modeling                     |
| Easy to explain to users | New/returning players not handled specially |
| Single rating value      | Can be gamed more easily                    |

#### Option B: Glicko-1 (Pokemon Showdown's choice)

More sophisticated, models uncertainty.

| Pros                         | Cons                           |
| ---------------------------- | ------------------------------ |
| Models uncertainty via RD    | More complex to implement      |
| New players calibrate faster | Harder to explain to users     |
| Handles returning players    | More state to track per player |
| Showdown-compatible          |                                |

### Decision Criteria

Choose **Elo** if: simplicity is priority, small initial player base, faster implementation needed.

Choose **Glicko** if: want Showdown parity, expect inactive/returning players, want better calibration.

### Additional Metrics (Either System)

Regardless of Elo vs Glicko, these Showdown metrics can be added:

| Metric   | Description                        | Purpose                        |
| -------- | ---------------------------------- | ------------------------------ |
| **GXE**  | Win probability vs random opponent | User-friendly % display        |
| **COIL** | Rating × games played factor       | Anti-smurf leaderboard ranking |

---

## Glicko-1 Details (Reference)

If Glicko is chosen, here are the specifics:

### Core Values

```typescript
interface GlickoRating {
  rating: number; // Skill estimate (1500 = average)
  rd: number; // Rating deviation (uncertainty)
  volatility?: number; // Optional: Glicko-2 adds this
}
```

### Constants (Showdown-aligned)

```typescript
const GLICKO_CONSTANTS = {
  // Starting values
  INITIAL_RATING: 1500, // Internal (display as 1000)
  INITIAL_RD: 130, // High uncertainty

  // RD bounds
  MIN_RD: 25, // Very confident
  MAX_RD: 130, // Very uncertain

  // Decay (inactivity)
  RD_DECAY_PER_DAY: 5, // RD increases when not playing

  // Display
  DISPLAY_OFFSET: 500, // display = internal - 500

  // Glicko formula constant
  Q: Math.log(10) / 400, // ≈ 0.00575646
};
```

### Rating Update Formula

After a match between winner and loser:

1. **G function** - reduces impact based on opponent's uncertainty:

   ```
   g(RD) = 1 / √(1 + 3q²RD²/π²)
   ```

2. **Expected score** - win probability:

   ```
   E(r, r_opp, g) = 1 / (1 + 10^(-g(r - r_opp)/400))
   ```

3. **New rating**:

   ```
   r_new = r + q/(1/RD² + 1/d²) × g × (S - E)
   ```

   Where S = 1 for win, 0 for loss

4. **New RD** (decreases after playing):
   ```
   RD_new = √(1 / (1/RD² + 1/d²))
   ```

### GXE Calculation

GXE = probability of beating a random 1500-rated player:

```typescript
function calculateGxe(rating: number, rd: number): number {
  const x = (rating - 1500) / Math.sqrt(200 * 200 + rd * rd);
  return 100 * normalCdf(x);
}
```

- GXE 50% = exactly average
- GXE 80% = beats 80% of random opponents
- GXE 90%+ = top tier player

### COIL Calculation

Anti-abuse metric for leaderboard ranking:

```typescript
function calculateCoil(
  rating: number,
  gamesPlayed: number,
  factor = 30
): number {
  const ratingComponent =
    (40 * (rating - 1000)) / (1 + Math.pow(10, (1500 - rating) / 400));
  const gamesComponent = (2 / Math.PI) * Math.atan(gamesPlayed / factor);
  return ratingComponent * gamesComponent;
}
```

**Why COIL matters:**

- Prevents 5-0 alt accounts from topping leaderboards
- Requires both high rating AND significant games
- `factor` varies by tier popularity (busier tiers = higher factor)

---

## Matchmaking Evolution

### Phase 1 (MVP): FIFO

```
Queue: [PlayerA, PlayerB, PlayerC] (ordered by join time)
Match: Pop first two → PlayerA vs PlayerB
```

### Phase 2: Rating-Based with Expanding Range

```typescript
interface MatchmakingConfig {
  initialRange: number; // ±100 rating at start
  expansionRate: number; // +10 per second
  maxRange: number; // Cap at ±500
}
```

**Algorithm:**

1. Player joins queue with their rating
2. Search for opponents within `initialRange`
3. Every second, expand range by `expansionRate`
4. Cap at `maxRange`
5. Prioritize players waiting longest (FIFO within acceptable range)

```typescript
function findMatch(seeker: QueueEntry, pool: QueueEntry[]): QueueEntry | null {
  const searchRange = calculateRange(seeker.joinedAt);

  // Find acceptable opponents, sorted by wait time (longest first)
  const candidates = pool
    .filter((p) => p.userId !== seeker.userId)
    .filter((p) => Math.abs(p.rating - seeker.rating) <= searchRange)
    .sort((a, b) => a.joinedAt - b.joinedAt);

  return candidates[0] ?? null;
}
```

### Phase 3: Add Ping/Region

```typescript
interface QueueEntryV3 extends QueueEntry {
  rating: number;
  rd: number;
  region: string;
  pingByRegion: Record<string, number>;
}
```

**Region selection:**

1. Both players provide ping to each server region
2. Find region where both have acceptable ping (<150ms)
3. Prefer region with lowest combined ping

---

## Database Schema

### Ladder Ratings Table

```sql
CREATE TABLE ladder_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  format_id VARCHAR(50) NOT NULL,

  -- Glicko values
  rating REAL NOT NULL DEFAULT 1500,
  rd REAL NOT NULL DEFAULT 130,

  -- Cached derived values
  gxe REAL NOT NULL DEFAULT 50,
  coil REAL NOT NULL DEFAULT 0,

  -- Stats
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  last_played TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, format_id)
);

CREATE INDEX idx_ladder_leaderboard ON ladder_ratings(format_id, coil DESC);
CREATE INDEX idx_ladder_user ON ladder_ratings(user_id);
```

### Drizzle Schema

```typescript
export const ladderRatings = pgTable(
  'ladder_ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    formatId: varchar('format_id', { length: 50 }).notNull(),

    rating: real('rating').notNull().default(1500),
    rd: real('rd').notNull().default(130),
    gxe: real('gxe').notNull().default(50),
    coil: real('coil').notNull().default(0),

    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),

    lastPlayed: timestamp('last_played', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userFormat: unique().on(table.userId, table.formatId),
    leaderboardIdx: index().on(table.formatId, table.coil),
  })
);
```

---

## Redis Data Model Evolution

### MVP (Current)

```
queue:{format}              # List of QueueEntry JSON
user:{userId}:queue         # Format user is queued for
```

### Phase 2 (Rating-Based)

```
matchmaking:{format}:pool   # Sorted set: score=rating, member=QueueEntry JSON
user:{userId}:queue         # Format user is queued for
user:{userId}:rating:{fmt}  # Cached rating for quick lookup
```

**Why sorted set?**

- `ZRANGEBYSCORE` for efficient rating-range queries
- Still supports FIFO via `joinedAt` in entry data

### Phase 3 (Multi-Region)

```
matchmaking:{format}:{region}:pool  # Sorted set per region
user:{userId}:region                # User's preferred region
user:{userId}:pings                 # JSON of ping by region
```

---

## Implementation Phases

### Phase 2A: Rating Storage (No Matchmaking Change)

1. Add `ladder_ratings` table
2. Create `GlickoService` for rating calculations
3. Update ratings after each battle
4. Display ratings in UI
5. **Matchmaking stays FIFO** - just store ratings

### Phase 2B: Rating-Based Matchmaking

1. Switch from Redis List to Sorted Set
2. Implement expanding range algorithm
3. Add `rating` to `QueueEntry`
4. Update `IMatchmakingService` interface

### Phase 2C: Leaderboards

1. Add leaderboard API endpoints
2. Implement COIL-based ranking
3. Add GXE display
4. Create leaderboard UI

### Phase 3: Ping & Region

1. Add ping measurement to client
2. Store ping data in queue entry
3. Add region selection to matchmaking
4. Deploy multi-region infrastructure

---

## API Changes

### Updated Queue Join (Phase 2)

```typescript
// MVP
POST /battle/queue/join
{ format: string, teamId: string }

// Phase 2
POST /battle/queue/join
{
  format: string,
  teamId: string,
  // Server fetches rating from DB - client doesn't send it
}
```

### Leaderboard Endpoints

```typescript
GET /ladder/:format
// Returns: { entries: LeaderboardEntry[], total: number }

GET /ladder/:format/rank/:userId
// Returns: { rank: number, rating: number, gxe: number, ... }

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  rating: number;      // Display rating (internal - 500)
  gxe: number;
  coil: number;
  wins: number;
  losses: number;
}
```

---

## MVP Extensibility Checklist

To ensure MVP code easily evolves to Phase 2:

### QueueEntry Type

```typescript
// Current (MVP) - keep simple
interface QueueEntry {
  userId: string;
  teamId: string;
  joinedAt: number;
}

// Phase 2 - extend with optional fields
interface QueueEntry {
  userId: string;
  teamId: string;
  joinedAt: number;
  // Phase 2 additions (optional for backward compatibility)
  rating?: number;
  rd?: number;
}

// Phase 3 - further extension
interface QueueEntry {
  userId: string;
  teamId: string;
  joinedAt: number;
  rating?: number;
  rd?: number;
  // Phase 3 additions
  region?: string;
  pingByRegion?: Record<string, number>;
}
```

### Matchmaking Interface

```typescript
// Current (MVP)
interface IMatchmakingService {
  joinQueue(userId: string, format: string, teamId: string): Promise<number>;
  leaveQueue(userId: string): Promise<void>;
  findMatch(format: string): Promise<MatchResult | null>;
}

// Phase 2 - add options parameter
interface JoinQueueOptions {
  userId: string;
  format: string;
  teamId: string;
  // Future: rating fetched server-side, not passed by client
}

interface MatchResult {
  player1: QueuedPlayer;
  player2: QueuedPlayer;
  // Phase 2 additions
  ratingDiff?: number;
  // Phase 3 additions
  selectedRegion?: string;
}

interface IMatchmakingService {
  joinQueue(options: JoinQueueOptions): Promise<QueueJoinResult>;
  leaveQueue(userId: string): Promise<void>;
  findMatch(format: string): Promise<MatchResult | null>;
}

interface QueueJoinResult {
  position: number;
  // Phase 2 additions
  estimatedWait?: number;
  currentRating?: number;
}
```

### Redis Key Structure

Keep keys extensible:

```typescript
// Good: namespaced, versioned structure
const RedisKeys = {
  matchmaking: {
    // MVP: queue as list
    queue: (format: string) => `matchmaking:${format}:queue`,
    // Phase 2: pool as sorted set (can coexist during migration)
    pool: (format: string) => `matchmaking:${format}:pool`,
    // Phase 3: regional pools
    regionalPool: (format: string, region: string) =>
      `matchmaking:${format}:${region}:pool`,
  },
};
```

---

## Summary

| Phase   | Matchmaking                  | Rating                       | Leaderboard |
| ------- | ---------------------------- | ---------------------------- | ----------- |
| **MVP** | FIFO queue                   | None                         | None        |
| **2A**  | FIFO queue                   | Glicko-1 (stored, displayed) | None        |
| **2B**  | Rating-based expanding range | Glicko-1                     | None        |
| **2C**  | Rating-based                 | Glicko-1                     | COIL-ranked |
| **3**   | Rating + region/ping         | Glicko-1                     | COIL-ranked |

The MVP implementation uses simple patterns (lists, FIFO) that can be swapped out without changing the interface contracts. Optional fields in types allow gradual enhancement without breaking changes.

---

## References

- [Glicko Rating System](http://www.glicko.net/glicko/glicko.pdf) - Original paper
- [Pokemon Showdown Ladder FAQ](https://pokemonshowdown.com/pages/ladderhelp)
- [Showdown Source: ladders.ts](https://github.com/smogon/pokemon-showdown/blob/master/server/ladders.ts)
