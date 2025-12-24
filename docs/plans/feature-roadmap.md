# PokeHub Feature Roadmap

A phased approach to building a Pokemon Showdown clone.

## Current State
- **Pokedex** - Browse Pokemon (functional)
- **Team Builder** - Create and manage teams (functional)
- **Battle** - Placeholder/empty
- **Dashboard** - Empty (to be removed)
- **User Menu** - Settings, View Profile, Edit Profile, My Teams, Logout

---

## Phase 1: Core Battle Loop (MVP)

**Goal:** Players can build a team and battle each other in real-time.

### Navigation Changes
```
Before:  Pokedex | Dashboard | Battle | Team Builder
After:   Pokedex | Battle | Team Builder
```

### User Menu Simplification
```
Before:  Settings | View Profile | Edit Profile | My Teams | Logout
After:   Profile | My Teams | Settings | Logout
```

### Settings Page (Phase 1)
Accessible from User Menu → Settings

**Note:** Theme toggle already exists in navbar.

#### Account Settings
| Setting | Action |
|---------|--------|
| **Username** | Display (read-only or editable) |
| **Email** | Display (from OAuth) |
| **Edit Profile** | Link to profile editor |
| **Change Avatar** | Upload/select avatar |
| **Delete Account** | With confirmation |
| **Logout** | Sign out |

#### Future Settings (add when relevant)
| Phase | Settings |
|-------|----------|
| Phase 1 (battles) | Animation speed, turn timer warning, confirm moves |
| Phase 3 (social) | Notification preferences, privacy settings |
| Phase 4 (tools) | Default format, show damage calc |

### Features

#### 1.1 Battle Page
The central hub for finding and starting battles.

| Component | Description |
|-----------|-------------|
| **Format Selector** | Choose battle format (initially just "Random Battle" and "OU") |
| **Find Battle Button** | Enter matchmaking queue |
| **Queue Status** | Show "Searching for opponent..." with cancel option |
| **Quick Team Select** | Choose which team to use (or random for Random Battle) |

#### 1.2 Real-Time Battle System
Leverages `@pkmn/sim` for battle simulation (same engine as Pokemon Showdown).

| Component | Description |
|-----------|-------------|
| **@pkmn/sim** | Handles all battle mechanics (damage, moves, abilities, etc.) |
| **WebSocket Gateway** | NestJS Gateway wrapping @pkmn/sim |
| **Battle Manager** | Create/manage battle instances, route player actions |
| **Turn Timer** | 60-90 second turn limit to prevent stalling |

##### @pkmn/sim Integration
```typescript
// Backend battle service using @pkmn/sim
import { BattleStreams, Teams } from '@pkmn/sim';

class BattleService {
  private battles: Map<string, BattleStreams.BattleStream>;

  createBattle(format: string, p1Team: string, p2Team: string) {
    const stream = new BattleStreams.BattleStream();

    // Start battle
    stream.write(`>start {"formatid":"${format}"}`);
    stream.write(`>player p1 {"team":"${p1Team}"}`);
    stream.write(`>player p2 {"team":"${p2Team}"}`);

    return stream;
  }

  sendMove(battleId: string, player: 'p1' | 'p2', move: string) {
    const stream = this.battles.get(battleId);
    stream.write(`>${player} ${move}`);  // e.g., ">p1 move thunderbolt"
  }

  // Stream outputs battle events to parse and send to clients
}
```

##### What @pkmn/sim Handles (we don't build)
- Damage calculation (including crits, type effectiveness)
- Move effects and secondary effects
- Ability triggers
- Status conditions (burn, paralysis, etc.)
- Weather and terrain
- Stat boosts/drops
- Turn order and priority
- All 900+ moves, 200+ abilities

##### What We Build
- WebSocket layer to connect clients to sim
- Battle event parser (sim output → client-friendly JSON)
- Turn timer enforcement
- Battle room management
- Persistence (save battles to DB)

##### NestJS WebSocket Architecture

**Flow: How a battle works end-to-end**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (NestJS)                           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │ WebSocket       │    │ Battle Manager  │    │ @pkmn/sim       │     │
│  │ Gateway         │───▶│ Service         │───▶│ BattleStream    │     │
│  │ (Socket.io)     │◀───│                 │◀───│                 │     │
│  └────────┬────────┘    └─────────────────┘    └─────────────────┘     │
│           │                                                             │
└───────────┼─────────────────────────────────────────────────────────────┘
            │
    ┌───────┴───────┐
    ▼               ▼
┌────────┐     ┌────────┐
│Player 1│     │Player 2│
│(React) │     │(React) │
└────────┘     └────────┘
```

**Step-by-step battle flow:**

```
1. MATCHMAKING
   Player 1 ──▶ [join queue] ──▶ MatchmakingService
   Player 2 ──▶ [join queue] ──▶ MatchmakingService
                                       │
                                       ▼
                               Match found! Create battle
                                       │
                                       ▼
2. BATTLE CREATION
   BattleManager.createBattle(player1, player2, format)
       │
       ├──▶ new BattleStreams.BattleStream()  // @pkmn/sim
       ├──▶ stream.write('>start {"formatid":"gen9ou"}')
       ├──▶ stream.write('>player p1 {"team":"..."}')
       ├──▶ stream.write('>player p2 {"team":"..."}')
       │
       └──▶ Emit to both clients: 'battle:start' with initial state

3. TURN LOOP
   ┌─────────────────────────────────────────────────────────┐
   │                                                         │
   │  Player 1 selects move ──▶ WebSocket: 'battle:move'     │
   │                                   │                     │
   │                                   ▼                     │
   │                     BattleManager.handleAction()        │
   │                           │                             │
   │                           ▼                             │
   │              stream.write('>p1 move thunderbolt')       │
   │                           │                             │
   │  Player 2 selects move ───┘                             │
   │              stream.write('>p2 move flamethrower')      │
   │                           │                             │
   │                           ▼                             │
   │              @pkmn/sim processes both moves             │
   │              Outputs battle events as text:             │
   │              |move|p1a: Pikachu|Thunderbolt|p2a: Char   │
   │              |-damage|p2a: Charizard|Pokemon:52/100     │
   │                           │                             │
   │                           ▼                             │
   │              BattleManager.parseSimOutput()             │
   │              Converts to structured JSON                │
   │                           │                             │
   │                           ▼                             │
   │              Emit to both: 'battle:events'              │
   │              [{type:'move', ...}, {type:'damage', ...}] │
   │                           │                             │
   │                           ▼                             │
   │              Clients update UI, play animations         │
   │                                                         │
   │  ◀─────────────── Repeat until battle ends ───────────▶ │
   └─────────────────────────────────────────────────────────┘

4. BATTLE END
   @pkmn/sim outputs: |win|player1
       │
       ▼
   Emit 'battle:end' { winner: 'player1' }
       │
       ▼
   Save battle record to database
```

**NestJS Gateway Implementation:**
```typescript
// apps/pokehub-api/src/battle/battle.gateway.ts
@WebSocketGateway({ namespace: 'battle' })
export class BattleGateway {
  constructor(
    private battleManager: BattleManagerService,
    private matchmaking: MatchmakingService,
  ) {}

  @SubscribeMessage('queue:join')
  async handleJoinQueue(client: Socket, data: { format: string; teamId: string }) {
    const userId = this.getUserId(client);
    const match = await this.matchmaking.joinQueue(userId, data.format, data.teamId);

    if (match) {
      // Match found - create battle
      const battle = await this.battleManager.createBattle(match);

      // Put both players in a room
      client.join(`battle:${battle.id}`);
      this.server.to(match.opponentSocketId).socketsJoin(`battle:${battle.id}`);

      // Send initial state to both
      this.server.to(`battle:${battle.id}`).emit('battle:start', battle.initialState);
    } else {
      client.emit('queue:waiting');
    }
  }

  @SubscribeMessage('battle:move')
  async handleMove(client: Socket, data: { battleId: string; moveIndex: number }) {
    const userId = this.getUserId(client);
    const events = await this.battleManager.submitMove(data.battleId, userId, data.moveIndex);

    // If both players have moved, sim runs and returns events
    if (events) {
      this.server.to(`battle:${data.battleId}`).emit('battle:events', events);
    }
  }

  @SubscribeMessage('battle:switch')
  async handleSwitch(client: Socket, data: { battleId: string; pokemonIndex: number }) {
    // Similar to handleMove
  }

  @SubscribeMessage('battle:forfeit')
  async handleForfeit(client: Socket, data: { battleId: string }) {
    const result = await this.battleManager.forfeit(data.battleId, this.getUserId(client));
    this.server.to(`battle:${data.battleId}`).emit('battle:end', result);
  }
}
```

**Battle Manager Service:**
```typescript
// apps/pokehub-api/src/battle/battle-manager.service.ts
@Injectable()
export class BattleManagerService {
  private activeBattles: Map<string, ActiveBattle> = new Map();

  async createBattle(match: Match): Promise<Battle> {
    const stream = new BattleStreams.BattleStream();
    const battleId = generateId();

    // Initialize battle in @pkmn/sim
    stream.write(`>start {"formatid":"${match.format}"}`);
    stream.write(`>player p1 {"name":"${match.p1.username}","team":"${match.p1.team}"}`);
    stream.write(`>player p2 {"name":"${match.p2.username}","team":"${match.p2.team}"}`);

    // Listen for sim output
    const battle: ActiveBattle = {
      id: battleId,
      stream,
      p1: match.p1,
      p2: match.p2,
      p1Choice: null,
      p2Choice: null,
    };

    // Parse initial state from stream output
    const initialState = await this.parseStreamOutput(stream);

    this.activeBattles.set(battleId, battle);
    return { id: battleId, initialState };
  }

  async submitMove(battleId: string, userId: string, moveIndex: number): Promise<BattleEvent[] | null> {
    const battle = this.activeBattles.get(battleId);
    const player = battle.p1.id === userId ? 'p1' : 'p2';

    // Store choice
    if (player === 'p1') battle.p1Choice = `move ${moveIndex + 1}`;
    else battle.p2Choice = `move ${moveIndex + 1}`;

    // Both players have chosen - execute turn
    if (battle.p1Choice && battle.p2Choice) {
      battle.stream.write(`>p1 ${battle.p1Choice}`);
      battle.stream.write(`>p2 ${battle.p2Choice}`);

      // Reset choices
      battle.p1Choice = null;
      battle.p2Choice = null;

      // Parse and return events
      return this.parseStreamOutput(battle.stream);
    }

    return null; // Waiting for other player
  }

  private async parseStreamOutput(stream: BattleStream): Promise<BattleEvent[]> {
    // @pkmn/sim outputs text like:
    // |move|p1a: Pikachu|Thunderbolt|p2a: Charizard
    // |-damage|p2a: Charizard|52/100
    //
    // Parse into structured events:
    // [{ type: 'move', player: 'p1', pokemon: 'Pikachu', move: 'Thunderbolt', target: 'Charizard' },
    //  { type: 'damage', pokemon: 'Charizard', hp: 52, maxHp: 100 }]
  }
}
```

**Key Points:**
- WebSocket handles connection, rooms, and message routing
- BattleManager wraps @pkmn/sim and manages battle state
- Both players' moves are collected before sim executes the turn
- Sim output is parsed into JSON events for the frontend
- All complex battle logic stays in @pkmn/sim

##### Battle State Storage

**Active Battles (in-progress)** → In-memory
```typescript
private activeBattles: Map<string, ActiveBattle> = new Map();
```
- @pkmn/sim BattleStream objects are JavaScript objects
- Lives only for duration of battle (typically 5-15 min)
- If server restarts, active battles are lost (acceptable for MVP)

**Completed Battles** → Database
- Winner, loser, format
- Battle log (for replays)
- Timestamps

**Scaling Path (Phase 2+):**
| Phase | Storage | Why |
|-------|---------|-----|
| MVP | In-memory Map | Simple, fast, no extra infra |
| Production | Redis | Survives restarts, horizontal scaling |

For production, serialize battle state to Redis periodically so:
- Server can restart without losing battles
- Multiple server instances can share battles
- Load balancer can route players to any server

##### Multi-Instance Scaling (Production)

**Problem:** With multiple backend instances behind a load balancer:
```
                    Load Balancer
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
        Server A     Server B     Server C
            │            │            │
        Player 1     Player 2     Player 3
```
- Player 1 and Player 2 might connect to different servers
- Socket.io rooms are per-server (they won't see each other)
- In-memory battle state isn't shared

**Solution: Redis Adapter + Shared State**

1. **Socket.io Redis Adapter** - Syncs rooms across servers
```typescript
// apps/pokehub-api/src/main.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

const server = app.getHttpServer();
const io = new Server(server);
io.adapter(createAdapter(pubClient, subClient));
```

2. **Redis for Battle State** - Share active battles across servers
```typescript
// Instead of: private battles = new Map()
// Use Redis:
async getBattle(battleId: string): Promise<ActiveBattle> {
  const data = await this.redis.get(`battle:${battleId}`);
  return JSON.parse(data);
}

async saveBattle(battle: ActiveBattle): Promise<void> {
  await this.redis.set(`battle:${battle.id}`, JSON.stringify(battle));
}
```

3. **Sticky Sessions (Alternative)** - Simpler but less flexible
```
Load Balancer (sticky sessions by battleId)
    │
    └──▶ All players in same battle → Same server
```

**Recommendation:**
- **MVP**: Single instance, in-memory (no complexity)
- **Phase 2+**: Add Redis adapter when scaling becomes needed
- Socket.io Redis adapter is a drop-in solution (minimal code change)

##### In-Battle Chat

Chat messages use the same WebSocket connection as battle actions.

**Flow:**
```
Player 1 types "gg" → WebSocket: 'battle:chat'
                           │
                           ▼
                   BattleGateway.handleChat()
                           │
                           ▼
            Broadcast to battle room: 'battle:chat'
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
         Player 1 sees              Player 2 sees
         "You: gg"                  "Opponent: gg"
```

**Gateway Handler:**
```typescript
@SubscribeMessage('battle:chat')
handleChat(client: Socket, data: { battleId: string; message: string }) {
  const userId = this.getUserId(client);
  const battle = this.battleManager.getBattle(data.battleId);

  // Determine sender name
  const sender = battle.p1.id === oderId ? battle.p1.username : battle.p2.username;

  // Broadcast to room (both players)
  this.server.to(`battle:${data.battleId}`).emit('battle:chat', {
    sender,
    message: data.message,
    timestamp: Date.now(),
  });

  // Optionally store in battle log for replays
  this.battleManager.addChatToLog(data.battleId, sender, data.message);
}
```

**Client Handling:**
```typescript
// In useBattleSocket hook
socket.on('battle:chat', (data) => {
  dispatch({
    type: 'CHAT_MESSAGE',
    payload: {
      sender: data.sender,
      message: data.message,
      isMe: data.sender === myUsername,
    },
  });
});
```

**Features:**
- Real-time delivery via WebSocket room
- Both players in same room receive all messages
- Messages optionally saved to battle log (for replay viewing)
- No persistence needed beyond battle duration
- Simple text only (no formatting for MVP)

**Moderation (Phase 3):**
- Chat filter for inappropriate content
- Mute opponent option
- Report button

#### 1.3 Battle UI
The in-battle interface.

| Component | Description |
|-----------|-------------|
| **Battle Field** | Show both Pokemon with sprites, HP bars, status icons |
| **Move Panel** | 4 move buttons with type, PP, and power info |
| **Switch Panel** | View team, switch Pokemon |
| **Battle Log** | Scrolling text log of actions ("Pikachu used Thunderbolt!") |
| **Chat Box** | Simple text chat with opponent |
| **Timer Display** | Show remaining time for current turn |
| **Forfeit Button** | Option to surrender |

##### Battle UI Layout (Desktop)
```
┌─────────────────────────────────────────────────────────────────┐
│  [Opponent Info]              TURN 5                   [Timer]  │
│  Charizard Lv100             OU Format                  0:45    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        ┌──────────────┐                         │
│                        │  Opponent's  │                         │
│                        │   Pokemon    │                         │
│                        │   Sprite     │                         │
│     [HP Bar ████████░░░░░░░░░░ 52%]   │                         │
│     [Status: BRN]                                               │
│                                                                 │
│                                                                 │
│     [HP Bar ████████████████░░ 85%]                             │
│     [Status: None]                                              │
│                        ┌──────────────┐                         │
│                        │    Your      │                         │
│                        │   Pokemon    │                         │
│                        │   Sprite     │                         │
│                        └──────────────┘                         │
│  [Your Info]                                                    │
│  Pikachu Lv100                                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ Thunderbolt     │  │ Volt Tackle     │     [Switch Pokemon]  │
│  │ ⚡ Electric     │  │ ⚡ Electric     │     [Forfeit]         │
│  │ PP: 15/15       │  │ PP: 10/15       │                       │
│  └─────────────────┘  └─────────────────┘                       │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ Iron Tail       │  │ Quick Attack    │                       │
│  │ ⚙️ Steel        │  │ ⬜ Normal       │                       │
│  │ PP: 15/15       │  │ PP: 30/30       │                       │
│  └─────────────────┘  └─────────────────┘                       │
├───────────────────────────────────┬─────────────────────────────┤
│          BATTLE LOG               │           CHAT              │
│  Pikachu used Thunderbolt!        │  You: gl hf                 │
│  It's super effective!            │  Opponent: u2               │
│  Charizard lost 48% HP!           │                             │
│  Charizard used Flamethrower!     │  [Type message...]    [Send]│
│  Pikachu lost 15% HP!             │                             │
└───────────────────────────────────┴─────────────────────────────┘
```

##### Battle UI Layout (Mobile)
```
┌─────────────────────────┐
│ OPP: Charizard   0:45   │
│ [████████░░░░ 52%] BRN  │
├─────────────────────────┤
│                         │
│    [Opponent Sprite]    │
│                         │
│                         │
│    [Your Sprite]        │
│                         │
├─────────────────────────┤
│ YOU: Pikachu            │
│ [████████████░░ 85%]    │
├─────────────────────────┤
│ Battle Log (scrollable) │
│ > Pikachu used Bolt!    │
├─────────────────────────┤
│ ┌───────────┬─────────┐ │
│ │Thunderbolt│Volt Tack│ │
│ │  ⚡ 15PP  │  ⚡ 10PP │ │
│ ├───────────┼─────────┤ │
│ │Iron Tail  │Quick Atk│ │
│ │  ⚙️ 15PP  │  ⬜ 30PP │ │
│ └───────────┴─────────┘ │
│ [Switch] [Chat] [Forfeit│
└─────────────────────────┘
```

##### Component Hierarchy
```
BattlePage/
├── BattleProvider (context for battle state)
│   ├── useBattleSocket() - WebSocket connection
│   └── useBattleState() - reducer for battle state
│
├── BattleHeader/
│   ├── FormatBadge - "OU", "Random Battle"
│   ├── TurnCounter - "Turn 5"
│   └── TurnTimer - countdown timer
│
├── BattleField/
│   ├── OpponentSide/
│   │   ├── PokemonSprite - animated sprite
│   │   ├── HPBar - animated HP bar with %
│   │   ├── StatusBadges - PAR, BRN, SLP, etc.
│   │   └── PokemonInfo - name, level
│   │
│   ├── FieldEffects/ - weather, terrain overlays
│   │
│   └── PlayerSide/
│       ├── PokemonSprite
│       ├── HPBar
│       ├── StatusBadges
│       └── PokemonInfo
│
├── ActionPanel/
│   ├── MovePanel/
│   │   └── MoveButton (x4)
│   │       ├── MoveName
│   │       ├── TypeBadge
│   │       ├── PPCounter
│   │       └── onClick → sendMove()
│   │
│   ├── SwitchPanel/
│   │   └── TeamMember (x5)
│   │       ├── PokemonIcon
│   │       ├── HPPreview
│   │       └── onClick → sendSwitch()
│   │
│   └── ActionButtons/
│       ├── ForfeitButton
│       └── ChatToggle (mobile)
│
├── BattleLog/
│   └── LogEntry (scrollable list)
│       ├── message text
│       └── timestamp
│
└── ChatPanel/
    ├── ChatMessages
    └── ChatInput
```

##### State Management
```typescript
// Battle state structure
interface BattleState {
  battleId: string;
  format: string;
  turn: number;
  phase: 'waiting' | 'active' | 'selecting' | 'animating' | 'ended';

  player: {
    id: string;
    username: string;
    active: Pokemon;
    team: Pokemon[];
    remainingTime: number;
  };

  opponent: {
    id: string;
    username: string;
    active: Pokemon;  // Only visible info (HP %, status, boosts)
    teamPreview: PokemonIcon[];  // Icons of remaining Pokemon
  };

  field: {
    weather: Weather | null;
    terrain: Terrain | null;
    playerSide: SideConditions;
    opponentSide: SideConditions;
  };

  log: LogEntry[];
  winner: string | null;
}

// Actions from WebSocket
type BattleAction =
  | { type: 'BATTLE_START'; payload: InitialState }
  | { type: 'TURN_START'; payload: { turn: number } }
  | { type: 'MOVE_USED'; payload: MoveEvent }
  | { type: 'DAMAGE'; payload: DamageEvent }
  | { type: 'SWITCH'; payload: SwitchEvent }
  | { type: 'STATUS'; payload: StatusEvent }
  | { type: 'FAINT'; payload: FaintEvent }
  | { type: 'BATTLE_END'; payload: { winner: string } }
  | { type: 'TIMER_UPDATE'; payload: { playerId: string; time: number } };
```

##### WebSocket Events
```typescript
// Client → Server
socket.emit('battle:join', { battleId });
socket.emit('battle:move', { battleId, moveIndex: 0 });
socket.emit('battle:switch', { battleId, pokemonIndex: 2 });
socket.emit('battle:forfeit', { battleId });
socket.emit('battle:chat', { battleId, message: 'gg' });

// Server → Client
socket.on('battle:state', (state) => dispatch({ type: 'SYNC', payload: state }));
socket.on('battle:event', (event) => dispatch(event));
socket.on('battle:timer', (data) => dispatch({ type: 'TIMER_UPDATE', payload: data }));
socket.on('battle:end', (result) => dispatch({ type: 'BATTLE_END', payload: result }));
```

##### Key Implementation Files
```
apps/pokehub-app/app/battle/
├── page.tsx                    # Battle lobby/matchmaking
├── [battleId]/
│   └── page.tsx                # Active battle page
│
packages/frontend/pokehub-battle-components/
├── src/lib/
│   ├── components/
│   │   ├── BattleField.tsx
│   │   ├── HPBar.tsx
│   │   ├── MoveButton.tsx
│   │   ├── PokemonSprite.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── BattleLog.tsx
│   │   ├── ActionPanel.tsx
│   │   └── ChatPanel.tsx
│   │
│   ├── context/
│   │   └── BattleContext.tsx   # Battle state provider
│   │
│   ├── hooks/
│   │   ├── useBattleSocket.ts  # WebSocket connection
│   │   └── useBattleState.ts   # State reducer
│   │
│   └── types/
│       └── battle.types.ts     # TypeScript interfaces

packages/frontend/pokehub-battle-components/
└── index.ts                    # Public exports
```

##### Animation Approach (MVP)
**Phase 1: React + CSS/Tailwind** (like Showdown)
- HP Bar: CSS transition (0.5s ease)
- Status Applied: CSS flash effect
- Fainting: CSS fade out
- Move Selection: Hover states, disabled for no PP
- Pokemon Sprites: Static images from @pkmn (can use animated GIFs)

**Phase 6: PixiJS Enhancement** (post-MVP)
Upgrade battle field to PixiJS canvas for:
- Animated Pokemon sprites (idle breathing from @pkmn)
- Generic move effects (~15 templates, type-colored):
  - Physical contact (slash/impact)
  - Special burst (explosion at target)
  - Beam attacks
  - Status buffs/debuffs (sparkle/dark flash)
- Particle systems (weather, type effects)
- Screen shake on critical hits
- Smooth entry/exit animations

This keeps MVP simple while having a clear upgrade path.

#### 1.4 Matchmaking System
Connecting players for battles.

| Component | Description |
|-----------|-------------|
| **Queue Manager** | Track players waiting by format |
| **Match Pairing** | Pair players from same format queue (FIFO initially) |
| **Room Creation** | Create battle room when match found |
| **Disconnect Handling** | Handle player disconnects gracefully |

#### 1.5 Battle Result
Post-battle screen.

| Component | Description |
|-----------|-------------|
| **Result Screen** | Win/Loss display with battle summary |
| **Rematch Option** | Challenge same opponent again |
| **Find New Battle** | Return to queue |
| **Exit to Menu** | Return to Battle page |

### Technical Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Battle Simulator** | @pkmn/sim | All battle mechanics (we don't build this) |
| **WebSocket Gateway** | NestJS + Socket.io | Connect clients to battle sim |
| **Battle Manager** | Node.js service | Manage active battles, parse sim output |
| **Client State** | React Context + useReducer | Manage battle UI state |

**Note:** Redis may be needed later for scaling (multiple server instances), but MVP can run battles in-memory since @pkmn/sim runs in Node.js.

### Database Schema Additions

```
battles
├── id (uuid)
├── format (string)
├── player1_id (fk users)
├── player2_id (fk users)
├── winner_id (fk users, nullable)
├── status (enum: active, completed, forfeited)
├── started_at (timestamp)
├── ended_at (timestamp, nullable)
└── battle_log (jsonb)
```

---

## Phase 2: Competitive Features

**Goal:** Add rankings and progression to make battles meaningful.

### Features

#### 2.1 Battle Formats
Different rulesets and tiers.

| Format | Description |
|--------|-------------|
| **Random Battle** | Random teams, no teambuilding required, great for quick play |
| **OU (OverUsed)** | Standard competitive tier, most Pokemon allowed |
| **UU (UnderUsed)** | Pokemon not common in OU |
| **Ubers** | Legendary/overpowered Pokemon allowed |
| **LC (Little Cup)** | First-stage Pokemon only, level 5 |
| **Monotype** | All Pokemon must share a type |

Each format requires:
- Ban list (Pokemon, moves, abilities, items)
- Clauses (Sleep Clause, Species Clause, etc.)
- Team validation rules

#### 2.2 Ladder/Rating System
ELO-based competitive rankings.

| Component | Description |
|-----------|-------------|
| **ELO Rating** | Starting 1000, gain/lose based on match results |
| **Rating Calculation** | K-factor based on games played (higher K early) |
| **Separate Ratings** | Each format has its own ladder |
| **Rating Display** | Show rating in profile, battle UI |
| **Rank Tiers** | Bronze/Silver/Gold/Platinum/Master based on rating |

#### 2.3 Leaderboards
Public rankings.

| Component | Description |
|-----------|-------------|
| **Global Leaderboard** | Top 100 players per format |
| **Personal Rank** | "You are #1,234 in OU" |
| **Filters** | Filter by format, time period (daily/weekly/all-time) |
| **Player Profiles** | Click to view player's public profile |

#### 2.4 Battle History
Record of past battles.

| Component | Description |
|-----------|-------------|
| **History List** | Paginated list of past battles |
| **Battle Summary** | Opponent, format, result, date |
| **Quick Stats** | Win/loss record by format |
| **Filters** | Filter by format, result, opponent |

#### 2.5 Replay System
Save and rewatch battles.

| Component | Description |
|-----------|-------------|
| **Auto-Save** | All ladder battles saved automatically |
| **Replay Viewer** | Step through battle turn by turn |
| **Playback Controls** | Play, pause, speed up, rewind |
| **Share Replays** | Public URL to share replay |
| **Download** | Export replay as file |

#### 2.6 Player Statistics
Detailed performance metrics.

| Component | Description |
|-----------|-------------|
| **Win Rate** | Overall and by format |
| **Most Used Pokemon** | Top 6 Pokemon by usage |
| **Most Used Teams** | Top teams by games played |
| **Win Streaks** | Current and best streak |
| **Rating History** | Graph of rating over time |

### Battle Page Expansion
```
Battle Page:
├── Find Match
│   ├── Format selector (with rating shown per format)
│   └── Queue button
├── My Battles
│   ├── Battle history list
│   └── Replay links
├── Leaderboards
│   ├── Format tabs
│   └── Top 100 list
└── My Stats
    ├── Rating overview
    └── Performance graphs
```

### User Menu Addition
- **My Stats** - Quick access to personal statistics page

### Database Schema Additions

```
player_ratings
├── id (uuid)
├── user_id (fk users)
├── format (string)
├── rating (integer, default 1000)
├── games_played (integer)
├── wins (integer)
├── losses (integer)
├── peak_rating (integer)
└── updated_at (timestamp)

replays
├── id (uuid)
├── battle_id (fk battles)
├── format (string)
├── player1_username (string, denormalized)
├── player2_username (string, denormalized)
├── winner_username (string, denormalized)
├── battle_data (jsonb, full battle log)
├── is_public (boolean)
├── views (integer)
└── created_at (timestamp)
```

---

## Phase 3: Social Features

**Goal:** Connect players, enable direct challenges, build community.

### Navigation Addition
```
Before:  Pokedex | Battle | Team Builder
After:   Pokedex | Lobby | Battle | Team Builder
```

### Features

#### 3.1 Lobby/Home Page
Central social hub.

| Component | Description |
|-----------|-------------|
| **Online Count** | "1,234 trainers online" |
| **Global Chat** | General chat room |
| **Format Rooms** | Chat rooms per format (OU Lobby, Random Lobby) |
| **Active Battles** | List of ongoing battles to spectate |
| **Announcements** | News, updates, maintenance notices |

#### 3.2 Friends System
Social connections.

| Component | Description |
|-----------|-------------|
| **Friend List** | List of friends with online status |
| **Add Friend** | Search by username, send request |
| **Friend Requests** | Accept/decline incoming requests |
| **Block User** | Block players from messaging/challenging |
| **Online Status** | Online/Away/In Battle/Offline |

#### 3.3 Direct Challenges
Battle friends directly.

| Component | Description |
|-----------|-------------|
| **Challenge Button** | On friend's profile or in friend list |
| **Format Selection** | Choose format for challenge |
| **Team Selection** | Pick team before sending challenge |
| **Challenge Notification** | Popup for recipient |
| **Accept/Decline** | Recipient can accept or decline |
| **Challenge Expiry** | Auto-decline after 60 seconds |

#### 3.4 Spectating
Watch live battles.

| Component | Description |
|-----------|-------------|
| **Live Battles List** | Browse ongoing public battles |
| **Spectate Button** | Join as spectator |
| **Spectator View** | Read-only battle view, see both sides |
| **Spectator Chat** | Chat with other spectators (hidden from players) |
| **Spectator Count** | "5 spectators watching" |

#### 3.5 Chat System
Real-time messaging.

| Component | Description |
|-----------|-------------|
| **Global Chat** | Public chat in Lobby |
| **Room Chat** | Format-specific chat rooms |
| **Private Messages** | Direct messages to friends |
| **Battle Chat** | In-battle chat with opponent |
| **Moderation** | Mute, report, chat filters |

#### 3.6 Notifications
Real-time alerts.

| Component | Description |
|-----------|-------------|
| **Challenge Received** | Popup + sound when challenged |
| **Friend Request** | Notification for new requests |
| **Friend Online** | Optional notification when friend comes online |
| **Notification Center** | View all notifications in User Menu |
| **Push Notifications** | Browser push for challenges (optional) |

### Lobby Page Structure
```
Lobby:
├── Header
│   └── Online trainers count
├── Sidebar
│   ├── Friends List (with online status)
│   ├── Friend Requests
│   └── Direct Message threads
├── Main Content
│   ├── Announcements banner
│   ├── Chat Room (tabs: Global, OU, Random, etc.)
│   └── Live Battles list
└── Activity Feed
    └── Recent battles, new champions, etc.
```

### User Menu Additions
- **Friends** - Open friends list/management
- **Messages** - View private messages
- **Notifications** - Notification center

### Database Schema Additions

```
friendships
├── id (uuid)
├── user_id (fk users)
├── friend_id (fk users)
├── status (enum: pending, accepted, blocked)
├── created_at (timestamp)
└── updated_at (timestamp)

messages
├── id (uuid)
├── sender_id (fk users)
├── recipient_id (fk users)
├── content (text)
├── read_at (timestamp, nullable)
└── created_at (timestamp)

notifications
├── id (uuid)
├── user_id (fk users)
├── type (enum: challenge, friend_request, message, system)
├── data (jsonb)
├── read (boolean)
└── created_at (timestamp)
```

---

## Phase 4: Tools & Quality of Life

**Goal:** Add tools competitive players expect.

### Features

#### 4.1 Damage Calculator
Essential competitive tool.

| Component | Description |
|-----------|-------------|
| **Pokemon Selector** | Choose attacker and defender |
| **Move Selector** | Pick move to calculate |
| **Stat Modifiers** | Set EVs, IVs, nature, boosts |
| **Field Conditions** | Weather, terrain, screens, etc. |
| **Damage Output** | Show damage range and % |
| **OHKO/2HKO Calc** | Calculate KO thresholds |
| **Import from Team** | Load Pokemon from saved teams |

#### 4.2 Team Validator
Check team legality.

| Component | Description |
|-----------|-------------|
| **Format Selector** | Choose format to validate against |
| **Team Input** | Paste team or select saved team |
| **Validation Results** | List of errors/warnings |
| **Auto-Fix Suggestions** | Suggest legal alternatives |
| **Real-time Validation** | Validate as you build in Team Builder |

#### 4.3 Import/Export
Showdown format compatibility.

| Component | Description |
|-----------|-------------|
| **Import Team** | Paste Showdown format, create team |
| **Export Team** | Copy team as Showdown format |
| **Batch Import** | Import multiple teams at once |
| **Format Detection** | Auto-detect team format |

#### 4.4 Team Sharing
Share teams with others.

| Component | Description |
|-----------|-------------|
| **Public Teams** | Mark team as public |
| **Team Browser** | Browse public teams by format |
| **Team Link** | Shareable URL for team |
| **Copy Team** | Clone public team to your collection |
| **Team Ratings** | Upvote/downvote teams |

#### 4.5 Extended Pokedex
Comprehensive game data.

| Tab | Content |
|-----|---------|
| **Pokemon** | Existing Pokedex (stats, types, abilities, moves) |
| **Moves** | All moves with details, filter by type/category |
| **Abilities** | All abilities with descriptions and Pokemon list |
| **Items** | All competitive items with effects |
| **Natures** | Nature chart with stat effects |
| **Type Chart** | Interactive type effectiveness chart |

### Pokedex Navigation
```
Pokedex:
├── Pokemon (existing)
├── Moves
├── Abilities
├── Items
└── Type Chart
```

### Tools Page (or integrate into Team Builder)
```
Tools:
├── Damage Calculator
├── Team Validator
└── Import/Export
```

---

## Phase 5: Extended Play Modes

**Goal:** More ways to play beyond ranked ladder.

### Features

#### 5.1 AI Battles
Practice against computer.

| Component | Description |
|-----------|-------------|
| **AI Difficulty** | Easy, Medium, Hard, Expert |
| **AI Behavior** | Different strategies per difficulty |
| **Practice Mode** | No rating impact |
| **Custom AI Teams** | AI uses random or set teams |
| **Move Hints** | Optional hints for beginners |

#### 5.2 Unranked/Casual
Play without pressure.

| Component | Description |
|-----------|-------------|
| **Casual Queue** | Separate from ranked |
| **No Rating** | Battles don't affect ladder |
| **Same Formats** | All formats available |
| **Shorter Timer** | Optional faster turn timer |

#### 5.3 Tournaments
Competitive bracket events.

| Component | Description |
|-----------|-------------|
| **Tournament Lobby** | List of upcoming/active tournaments |
| **Registration** | Sign up for tournaments |
| **Bracket View** | Visual tournament bracket |
| **Auto-Matching** | Automatic pairing each round |
| **Prizes** | Cosmetic rewards for winners |
| **Scheduled Events** | Weekly/monthly official tournaments |

#### 5.4 Custom Formats
User-created rulesets.

| Component | Description |
|-----------|-------------|
| **Format Creator** | Define custom bans/rules |
| **Share Formats** | Share custom format with friends |
| **Custom Lobbies** | Create room with custom format |
| **Format Templates** | Start from existing format |

#### 5.5 Team Preview
Optional pre-battle phase.

| Component | Description |
|-----------|-------------|
| **Preview Phase** | See opponent's 6 Pokemon before battle |
| **Lead Selection** | Choose your lead after seeing team |
| **Timer** | 90 seconds for team preview |
| **Optional** | Can be enabled/disabled per format |

---

## Phase 6: Polish & Growth

**Goal:** Enhance experience and retention.

### Features

#### 6.1 Achievements
Reward milestones.

| Category | Examples |
|----------|----------|
| **Battle** | Win 10/50/100 battles, First win, Win streak |
| **Ladder** | Reach 1200/1400/1600 rating, Reach top 100 |
| **Collection** | Create 10 teams, Complete Pokedex |
| **Social** | Add 5 friends, Spectate 10 battles |
| **Special** | Win with monotype team, Win in 3 turns |

#### 6.2 Trainer Card
Public profile customization.

| Component | Description |
|-----------|-------------|
| **Card Design** | Choose background, frame, badges |
| **Featured Pokemon** | Display favorite Pokemon |
| **Stats Display** | Show rating, win rate, achievements |
| **Bio** | Short profile description |
| **Share Card** | Image export for social media |

#### 6.3 Seasonal Ladders
Competitive seasons.

| Component | Description |
|-----------|-------------|
| **Season Length** | 1-3 month seasons |
| **Ladder Reset** | Soft reset at season start |
| **Season Rewards** | Cosmetics based on final rank |
| **Season History** | View past season rankings |
| **Leaderboard Archive** | Historical top 100 |

#### 6.4 Cosmetics & Rewards
Visual customization.

| Component | Description |
|-----------|-------------|
| **Avatar Frames** | Border decorations |
| **Name Colors** | Username color options |
| **Battle Themes** | Different battle backgrounds |
| **Chat Emotes** | Custom emotes |
| **Achievement Badges** | Display earned badges |

#### 6.5 Mobile Optimization
Improved mobile experience.

| Component | Description |
|-----------|-------------|
| **Touch Controls** | Optimized for tap interactions |
| **Responsive Battle UI** | Battle UI adapts to screen size |
| **Offline Team Building** | Build teams without connection |
| **Push Notifications** | Challenge alerts on mobile |
| **PWA Support** | Install as mobile app |

---

## Summary

| Phase | Focus | Key Deliverable |
|-------|-------|-----------------|
| 1 | Core Loop | Working multiplayer battles |
| 2 | Competitive | Ladder rankings & replays |
| 3 | Social | Friends, lobby, spectating |
| 4 | Tools | Damage calc, import/export |
| 5 | Game Modes | AI, tournaments |
| 6 | Polish | Achievements, seasons |

---

## Immediate Next Steps (Phase 1)

### Frontend Changes
1. **Remove Dashboard from navbar** - `packages/frontend/pokehub-nav-components/`
2. **Simplify User Menu** - Combine View/Edit Profile into single "Profile" link
3. **Create Battle page** - `apps/pokehub-app/app/battle/page.tsx`
4. **Create Battle UI components** - `packages/frontend/pokehub-battle-components/`

### Backend Infrastructure
5. **Install @pkmn/sim** - Battle simulation engine
6. **WebSocket Gateway** - NestJS gateway wrapping @pkmn/sim
7. **Battle Manager Service** - Create/manage battles, parse sim output
8. **Matchmaking Service** - Queue players, pair for battles

### Database
9. **Battles table** - Store battle records
10. **Migrations** - Drizzle schema updates

---

## File Locations (for reference)

| Component | Path |
|-----------|------|
| Navbar | `packages/frontend/pokehub-nav-components/src/lib/components/` |
| User Menu (Desktop) | `packages/frontend/pokehub-nav-components/src/lib/components/desktop/user-dropdown.tsx` |
| User Menu (Mobile) | `packages/frontend/pokehub-nav-components/src/lib/components/mobile/user-menu.tsx` |
| App Routes | `apps/pokehub-app/app/` |
| API | `apps/pokehub-api/src/` |
| Database | `packages/backend/pokehub-postgres/` |
