import { AppModule } from '../../../pokehub-api/src/app/app.module';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  REDIS_SERVICE,
  type RedisService,
} from '@pokehub/backend/pokehub-redis';
import {
  TEAMS_DB_SERVICE,
  type ITeamsDBService,
} from '@pokehub/backend/pokehub-teams-db';
import {
  USERS_DB_SERVICE,
  type IUsersDBService,
} from '@pokehub/backend/pokehub-users-db';
import {
  JWT_AUTH_SERVICE,
  type IJwtAuthService,
  type UserJwtData,
} from '@pokehub/backend/shared-auth-utils';
import {
  BATTLE_NAMESPACE,
  BATTLE_EVENT,
  type ServerBattleEvent,
} from '@pokehub/shared/pokemon-battle-types';
import { WsThrottlerGuard } from '../../../pokehub-api/src/battle/guards/ws-throttler.guard';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import { io, type Socket } from 'socket.io-client';

describe('Battle API (e2e)', () => {
  let app: INestApplication;
  let jwtService: IJwtAuthService;
  let usersDBService: IUsersDBService;
  let teamsDBService: ITeamsDBService;
  let redisService: RedisService;

  // Test user data
  let testUser1: UserJwtData;
  let testUser2: UserJwtData;
  let user1AccessToken: string;
  let user2AccessToken: string;

  // Test team IDs
  let user1TeamId: string;
  let user2TeamId: string;

  // Server address for socket connection
  let serverAddress: string;

  // Helper to create valid Pokemon data for AG format
  const createMockPokemon = (
    overrides?: Partial<PokemonInTeam>
  ): PokemonInTeam => ({
    species: 'Charizard' as PokemonInTeam['species'],
    name: '',
    ability: 'Blaze' as PokemonInTeam['ability'],
    item: 'Heavy-Duty Boots' as PokemonInTeam['item'],
    nature: 'Timid' as PokemonInTeam['nature'],
    gender: 'M',
    level: 100,
    moves: [
      'Flamethrower',
      'Air Slash',
      'Roost',
      'Will-O-Wisp',
    ] as PokemonInTeam['moves'],
    evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    ...overrides,
  });

  /**
   * Helper to connect a socket with authentication
   */
  function connectSocket(token: string): Socket {
    return io(`${serverAddress}${BATTLE_NAMESPACE}`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });
  }

  /**
   * Helper to wait for a specific event type
   */
  function waitForEvent(
    socket: Socket,
    eventType: ServerBattleEvent['type'],
    timeout = 5000
  ): Promise<ServerBattleEvent> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const handler = (event: ServerBattleEvent) => {
        if (event.type === eventType) {
          clearTimeout(timer);
          socket.off(BATTLE_EVENT, handler);
          resolve(event);
        }
      };

      socket.on(BATTLE_EVENT, handler);
    });
  }

  /**
   * Helper to wait for socket connection
   */
  function waitForConnect(socket: Socket, timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (socket.connected) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, timeout);

      socket.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });

      socket.once('connect_error', (error: Error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /**
   * Helper to wait for socket disconnect
   */
  function waitForDisconnect(socket: Socket, timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (socket.disconnected) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Socket disconnect timeout'));
      }, timeout);

      socket.once('disconnect', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(WsThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Start listening on a random port for WebSocket tests
    const server = app.getHttpServer();
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === 'object' ? address?.port : 0;
    serverAddress = `http://localhost:${port}`;

    // Get services
    jwtService = app.get<IJwtAuthService>(JWT_AUTH_SERVICE);
    usersDBService = app.get<IUsersDBService>(USERS_DB_SERVICE);
    teamsDBService = app.get<ITeamsDBService>(TEAMS_DB_SERVICE);
    redisService = app.get<RedisService>(REDIS_SERVICE);

    // Create or get test users
    let user1 = await usersDBService.getUserByEmail(
      'battle-e2e-user1@test.com'
    );
    if (!user1) {
      user1 = await usersDBService.createUser(
        'battle-e2e-user1@test.com',
        'GOOGLE'
      );
    }

    let user2 = await usersDBService.getUserByEmail(
      'battle-e2e-user2@test.com'
    );
    if (!user2) {
      user2 = await usersDBService.createUser(
        'battle-e2e-user2@test.com',
        'GOOGLE'
      );
    }

    testUser1 = {
      id: user1.id,
      email: user1.email,
      accountType: user1.accountType,
      accountRole: user1.accountRole,
    };

    testUser2 = {
      id: user2.id,
      email: user2.email,
      accountType: user2.accountType,
      accountRole: user2.accountRole,
    };

    // Generate access tokens
    user1AccessToken = await jwtService.generateToken(
      testUser1,
      'ACCESS_TOKEN'
    );
    user2AccessToken = await jwtService.generateToken(
      testUser2,
      'ACCESS_TOKEN'
    );

    // Create teams for both users
    const team1 = await teamsDBService.createTeam({
      userId: testUser1.id,
      name: 'Battle E2E Team 1',
      generation: 9,
      format: 'anythinggoes',
      pokemon: [createMockPokemon()],
    });
    user1TeamId = team1.id;

    const team2 = await teamsDBService.createTeam({
      userId: testUser2.id,
      name: 'Battle E2E Team 2',
      generation: 9,
      format: 'anythinggoes',
      pokemon: [
        createMockPokemon({
          species: 'Blastoise' as PokemonInTeam['species'],
          ability: 'Torrent' as PokemonInTeam['ability'],
          moves: [
            'Hydro Pump',
            'Ice Beam',
            'Rapid Spin',
            'Shell Smash',
          ] as PokemonInTeam['moves'],
        }),
      ],
    });
    user2TeamId = team2.id;

    // Clean up any leftover state from previous test runs
    await cleanupUserBattleState();
  }, 30000);

  /**
   * Helper to clean up user battle state in Redis.
   * This prevents leftover state from previous test runs from affecting tests.
   * Clears both battle state and queue status for both test users.
   */
  async function cleanupUserBattleState(): Promise<void> {
    const format = 'gen9anythinggoes';
    if (testUser1?.id) {
      await redisService.clearUserBattle(testUser1.id);
      await redisService.clearUserQueueStatus(testUser1.id);
      await redisService.removeFromQueue(format, testUser1.id);
    }
    if (testUser2?.id) {
      await redisService.clearUserBattle(testUser2.id);
      await redisService.clearUserQueueStatus(testUser2.id);
      await redisService.removeFromQueue(format, testUser2.id);
    }
  }

  afterAll(async () => {
    // Clean up teams
    if (user1TeamId) {
      try {
        await teamsDBService.deleteTeam(user1TeamId, testUser1.id);
      } catch {
        // Team might already be deleted
      }
    }

    if (user2TeamId) {
      try {
        await teamsDBService.deleteTeam(user2TeamId, testUser2.id);
      } catch {
        // Team might already be deleted
      }
    }

    await app.close();
  });

  describe('Connection & Auth', () => {
    it('should connect successfully with valid JWT', async () => {
      const socket = connectSocket(user1AccessToken);

      await waitForConnect(socket);
      expect(socket.connected).toBe(true);

      socket.disconnect();
    });

    it('should disconnect immediately with invalid JWT', async () => {
      const socket = connectSocket('invalid-token');

      // The server should disconnect us
      await waitForDisconnect(socket);
      expect(socket.connected).toBe(false);

      socket.disconnect();
    });

    it('should disconnect with missing token', async () => {
      const socket = io(`${serverAddress}${BATTLE_NAMESPACE}`, {
        transports: ['websocket'],
        forceNew: true,
      });

      await waitForDisconnect(socket);
      expect(socket.connected).toBe(false);

      socket.disconnect();
    });
  });

  describe('Queue Management', () => {
    let socket: Socket;

    beforeEach(async () => {
      await cleanupUserBattleState();
      socket = connectSocket(user1AccessToken);
      await waitForConnect(socket);
    });

    afterEach(() => {
      socket.disconnect();
    });

    it('should receive QUEUE_JOINED with position when joining with valid team', async () => {
      socket.emit('JOIN_QUEUE', {
        format: 'gen9anythinggoes',
        teamId: user1TeamId,
      });

      const event = await waitForEvent(socket, 'QUEUE_JOINED');
      expect(event.type).toBe('QUEUE_JOINED');
      expect((event as { position: number }).position).toBeGreaterThanOrEqual(
        1
      );
    });

    it('should receive ERROR with TEAM_NOT_FOUND when joining with non-existent teamId', async () => {
      socket.emit('JOIN_QUEUE', {
        format: 'gen9anythinggoes',
        teamId: '00000000-0000-0000-0000-000000000000',
      });

      const event = await waitForEvent(socket, 'ERROR');
      expect(event.type).toBe('ERROR');
      expect((event as { code: string }).code).toBe('TEAM_NOT_FOUND');
    });

    it('should receive ERROR with INVALID_TEAM when joining with another users team', async () => {
      socket.emit('JOIN_QUEUE', {
        format: 'gen9anythinggoes',
        teamId: user2TeamId, // User1 trying to use User2's team
      });

      const event = await waitForEvent(socket, 'ERROR');
      expect(event.type).toBe('ERROR');
      expect((event as { code: string }).code).toBe('INVALID_TEAM');
    });

    it('should receive QUEUE_LEFT when leaving queue', async () => {
      // First join the queue
      socket.emit('JOIN_QUEUE', {
        format: 'gen9anythinggoes',
        teamId: user1TeamId,
      });
      await waitForEvent(socket, 'QUEUE_JOINED');

      // Then leave
      socket.emit('LEAVE_QUEUE', {});

      const event = await waitForEvent(socket, 'QUEUE_LEFT');
      expect(event.type).toBe('QUEUE_LEFT');
    });

    it('should receive ERROR with INVALID_INPUT for invalid input', async () => {
      socket.emit('JOIN_QUEUE', {
        // Missing format and teamId
      });

      const event = await waitForEvent(socket, 'ERROR');
      expect(event.type).toBe('ERROR');
      expect((event as { code: string }).code).toBe('INVALID_INPUT');
    });
  });

  describe('Matchmaking & Battle Flow', () => {
    let socket1: Socket;
    let socket2: Socket;

    beforeEach(async () => {
      await cleanupUserBattleState();
      socket1 = connectSocket(user1AccessToken);
      socket2 = connectSocket(user2AccessToken);
      await Promise.all([waitForConnect(socket1), waitForConnect(socket2)]);
    });

    afterEach(() => {
      socket1.disconnect();
      socket2.disconnect();
    });

    it('should match two players and start battle', async () => {
      const format = 'gen9anythinggoes';

      // Set up listener BEFORE emitting to avoid race condition
      const queue1Promise = waitForEvent(socket1, 'QUEUE_JOINED');
      socket1.emit('JOIN_QUEUE', { format, teamId: user1TeamId });
      const queue1Event = await queue1Promise;
      expect(queue1Event.type).toBe('QUEUE_JOINED');

      // Set up listeners for BATTLE_START before player 2 joins
      const start1Promise = waitForEvent(socket1, 'BATTLE_START', 10000);
      const start2Promise = waitForEvent(socket2, 'BATTLE_START', 10000);

      // Player 2 joins queue - should trigger match
      socket2.emit('JOIN_QUEUE', { format, teamId: user2TeamId });

      // Both should receive BATTLE_START
      const [start1, start2] = await Promise.all([
        start1Promise,
        start2Promise,
      ]);

      expect(start1.type).toBe('BATTLE_START');
      expect(start2.type).toBe('BATTLE_START');

      // Both should have same battleId
      const battleId1 = (start1 as { battleId: string }).battleId;
      const battleId2 = (start2 as { battleId: string }).battleId;
      expect(battleId1).toBe(battleId2);

      // Both should have non-empty initial state
      const state1 = (start1 as { initialState: string }).initialState;
      const state2 = (start2 as { initialState: string }).initialState;
      expect(state1).toBeTruthy();
      expect(state2).toBeTruthy();

      // Per-player perspective: each player should receive DIFFERENT state
      // because @pkmn/sim sends per-player views with |request| data
      // unique to that player's side (opponent info is redacted)
      expect(state1).not.toBe(state2);

      // Both should contain their own |request| data (active moves, etc.)
      expect(state1).toContain('|request|');
      expect(state2).toContain('|request|');
    }, 15000);
  });

  describe('Forfeit', () => {
    let socket1: Socket;
    let socket2: Socket;
    let battleId: string;

    beforeEach(async () => {
      await cleanupUserBattleState();
      socket1 = connectSocket(user1AccessToken);
      socket2 = connectSocket(user2AccessToken);
      await Promise.all([waitForConnect(socket1), waitForConnect(socket2)]);

      // Create a match
      const format = 'gen9anythinggoes';
      socket1.emit('JOIN_QUEUE', { format, teamId: user1TeamId });
      await waitForEvent(socket1, 'QUEUE_JOINED');

      socket2.emit('JOIN_QUEUE', { format, teamId: user2TeamId });

      // Wait for battle to start
      const startEvent = await waitForEvent(socket1, 'BATTLE_START', 10000);
      battleId = (startEvent as { battleId: string }).battleId;
    }, 15000);

    afterEach(() => {
      socket1.disconnect();
      socket2.disconnect();
    });

    it('should end battle with opponent as winner when forfeiting', async () => {
      // Set up listeners for both players before forfeiting
      const end1Promise = waitForEvent(socket1, 'BATTLE_END');
      const end2Promise = waitForEvent(socket2, 'BATTLE_END');

      // Player 1 forfeits
      socket1.emit('FORFEIT', { battleId });

      // Both players should receive BATTLE_END with player 2 as winner
      const [end1Event, end2Event] = await Promise.all([
        end1Promise,
        end2Promise,
      ]);

      // Verify player 1's event
      expect(end1Event.type).toBe('BATTLE_END');
      expect((end1Event as { winner: string }).winner).toBe(testUser2.id);
      expect((end1Event as { reason: string }).reason).toBe('forfeit');

      // Verify player 2's event
      expect(end2Event.type).toBe('BATTLE_END');
      expect((end2Event as { winner: string }).winner).toBe(testUser2.id);
      expect((end2Event as { reason: string }).reason).toBe('forfeit');
    });

    it('should set player 1 as winner when player 2 forfeits', async () => {
      // Set up listeners for both players before forfeiting
      const end1Promise = waitForEvent(socket1, 'BATTLE_END');
      const end2Promise = waitForEvent(socket2, 'BATTLE_END');

      // Player 2 forfeits
      socket2.emit('FORFEIT', { battleId });

      // Both players should receive BATTLE_END with player 1 as winner
      const [end1Event, end2Event] = await Promise.all([
        end1Promise,
        end2Promise,
      ]);

      // Verify winner is player 1
      expect((end1Event as { winner: string }).winner).toBe(testUser1.id);
      expect((end2Event as { winner: string }).winner).toBe(testUser1.id);
      expect((end1Event as { reason: string }).reason).toBe('forfeit');
      expect((end2Event as { reason: string }).reason).toBe('forfeit');
    });
  });

  describe('Match Decline', () => {
    let socket1: Socket;
    let socket2: Socket;

    beforeEach(async () => {
      await cleanupUserBattleState();
      socket1 = connectSocket(user1AccessToken);
      socket2 = connectSocket(user2AccessToken);
      await Promise.all([waitForConnect(socket1), waitForConnect(socket2)]);
    });

    afterEach(async () => {
      socket1.disconnect();
      socket2.disconnect();
      await Promise.all([
        waitForDisconnect(socket1, 2000).catch(() => undefined),
        waitForDisconnect(socket2, 2000).catch(() => undefined),
      ]);
      await cleanupUserBattleState();
    });

    it('should cancel battle and notify opponent when declining', async () => {
      const format = 'gen9anythinggoes';

      // Create a match
      socket1.emit('JOIN_QUEUE', { format, teamId: user1TeamId });
      await waitForEvent(socket1, 'QUEUE_JOINED');

      const start2Promise = waitForEvent(socket2, 'BATTLE_START', 10000);
      socket2.emit('JOIN_QUEUE', { format, teamId: user2TeamId });

      const start2 = await start2Promise;
      const battleId = (start2 as { battleId: string }).battleId;

      // Player 1 declines
      const cancelPromise = waitForEvent(socket2, 'MATCH_CANCELLED', 5000);
      socket1.emit('DECLINE_MATCH', { battleId });

      const cancelEvent = await cancelPromise;
      expect(cancelEvent.type).toBe('MATCH_CANCELLED');
      expect((cancelEvent as { battleId: string }).battleId).toBe(battleId);
    }, 20000);

    it('should send MATCH_CANCELLED with opponent_declined reason', async () => {
      const format = 'gen9anythinggoes';

      socket1.emit('JOIN_QUEUE', { format, teamId: user1TeamId });
      await waitForEvent(socket1, 'QUEUE_JOINED');

      const start1Promise = waitForEvent(socket1, 'BATTLE_START', 10000);
      const start2Promise = waitForEvent(socket2, 'BATTLE_START', 10000);
      socket2.emit('JOIN_QUEUE', { format, teamId: user2TeamId });

      const [start1] = await Promise.all([start1Promise, start2Promise]);
      const battleId = (start1 as { battleId: string }).battleId;

      const cancelPromise = waitForEvent(socket2, 'MATCH_CANCELLED', 5000);
      socket1.emit('DECLINE_MATCH', { battleId });

      const cancelEvent = await cancelPromise;
      expect(cancelEvent.type).toBe('MATCH_CANCELLED');
      expect((cancelEvent as { reason: string }).reason).toBe('opponent_declined');
    }, 20000);
  });

  describe('Queue Observer', () => {
    let observer: Socket;
    let player: Socket;

    beforeEach(async () => {
      await cleanupUserBattleState();
      observer = connectSocket(user1AccessToken);
      player = connectSocket(user2AccessToken);
      await Promise.all([waitForConnect(observer), waitForConnect(player)]);
    });

    afterEach(async () => {
      observer.disconnect();
      player.disconnect();
      await Promise.all([
        waitForDisconnect(observer, 2000).catch(() => undefined),
        waitForDisconnect(player, 2000).catch(() => undefined),
      ]);
      await cleanupUserBattleState();
    });

    it('should receive QUEUE_COUNTS on OBSERVE_QUEUE', async () => {
      observer.emit('OBSERVE_QUEUE', {});

      const event = await waitForEvent(observer, 'QUEUE_COUNTS');
      expect(event.type).toBe('QUEUE_COUNTS');
      expect((event as { counts: Record<string, number> }).counts).toBeDefined();
    });

    it('should receive updated counts when a player joins queue', async () => {
      observer.emit('OBSERVE_QUEUE', {});
      await waitForEvent(observer, 'QUEUE_COUNTS');

      // Listen for next QUEUE_COUNTS broadcast
      const updatePromise = waitForEvent(observer, 'QUEUE_COUNTS', 5000);

      // Player joins queue — should trigger broadcast to lobby
      player.emit('JOIN_QUEUE', {
        format: 'gen9anythinggoes',
        teamId: user2TeamId,
      });

      const updateEvent = await updatePromise;
      expect(updateEvent.type).toBe('QUEUE_COUNTS');
      const counts = (updateEvent as { counts: Record<string, number> }).counts;
      expect(counts['gen9anythinggoes']).toBeGreaterThanOrEqual(1);
    });

    it('should stop receiving counts after UNOBSERVE_QUEUE', async () => {
      observer.emit('OBSERVE_QUEUE', {});
      await waitForEvent(observer, 'QUEUE_COUNTS');

      // Unobserve
      observer.emit('UNOBSERVE_QUEUE', {});

      // Collect any events that arrive in the next 2 seconds
      const events: ServerBattleEvent[] = [];
      const collector = (e: ServerBattleEvent) => events.push(e);
      observer.on(BATTLE_EVENT, collector);

      // Player joins queue — would normally trigger QUEUE_COUNTS
      player.emit('JOIN_QUEUE', {
        format: 'gen9anythinggoes',
        teamId: user2TeamId,
      });

      // Wait a bit to confirm no QUEUE_COUNTS arrives
      await new Promise((r) => setTimeout(r, 2000));
      observer.off(BATTLE_EVENT, collector);

      const countEvents = events.filter((e) => e.type === 'QUEUE_COUNTS');
      expect(countEvents).toHaveLength(0);
    }, 10000);
  });

  describe('Cancel Choice', () => {
    let socket1: Socket;
    let socket2: Socket;
    let battleId: string;

    beforeEach(async () => {
      await cleanupUserBattleState();
      socket1 = connectSocket(user1AccessToken);
      socket2 = connectSocket(user2AccessToken);
      await Promise.all([waitForConnect(socket1), waitForConnect(socket2)]);

      // Create a match
      const format = 'gen9anythinggoes';
      socket1.emit('JOIN_QUEUE', { format, teamId: user1TeamId });
      await waitForEvent(socket1, 'QUEUE_JOINED');

      socket2.emit('JOIN_QUEUE', { format, teamId: user2TeamId });

      const startEvent = await waitForEvent(socket1, 'BATTLE_START', 10000);
      battleId = (startEvent as { battleId: string }).battleId;
    }, 15000);

    it('should allow cancelling a submitted move before opponent acts', async () => {
      // Submit a move
      socket1.emit('MOVE', { battleId, choice: 'move 1' });

      // Cancel the choice
      socket1.emit('CANCEL_CHOICE', { battleId });

      // Submit a different move — should not error
      socket1.emit('MOVE', { battleId, choice: 'move 2' });

      // If cancel failed, the second move would trigger an error.
      // Wait briefly and verify no error was received.
      const events: ServerBattleEvent[] = [];
      const collector = (e: ServerBattleEvent) => events.push(e);
      socket1.on(BATTLE_EVENT, collector);

      await new Promise((r) => setTimeout(r, 1500));
      socket1.off(BATTLE_EVENT, collector);

      const errors = events.filter(
        (e) => e.type === 'ERROR' && (e as { code: string }).code === 'CANCEL_CHOICE_ERROR'
      );
      expect(errors).toHaveLength(0);
    });

    afterEach(async () => {
      socket1.disconnect();
      socket2.disconnect();
      await Promise.all([
        waitForDisconnect(socket1, 2000).catch(() => undefined),
        waitForDisconnect(socket2, 2000).catch(() => undefined),
      ]);
      await cleanupUserBattleState();
    });
  });

  describe('Reconnection', () => {
    let socket1: Socket;
    let socket2: Socket;
    let battleId: string;

    beforeEach(async () => {
      await cleanupUserBattleState();
      socket1 = connectSocket(user1AccessToken);
      socket2 = connectSocket(user2AccessToken);
      await Promise.all([waitForConnect(socket1), waitForConnect(socket2)]);

      // Create a match
      const format = 'gen9anythinggoes';
      socket1.emit('JOIN_QUEUE', { format, teamId: user1TeamId });
      await waitForEvent(socket1, 'QUEUE_JOINED');

      socket2.emit('JOIN_QUEUE', { format, teamId: user2TeamId });

      // Wait for battle to start
      const startEvent = await waitForEvent(socket1, 'BATTLE_START', 10000);
      battleId = (startEvent as { battleId: string }).battleId;
    }, 15000);

    afterEach(async () => {
      socket1.disconnect();
      socket2.disconnect();
      await Promise.all([
        waitForDisconnect(socket1, 2000).catch(() => undefined),
        waitForDisconnect(socket2, 2000).catch(() => undefined),
      ]);
      await cleanupUserBattleState();
    });

    it('should notify opponent when player disconnects', async () => {
      // Set up listener for disconnect event before disconnecting
      const disconnectPromise = waitForEvent(socket2, 'OPPONENT_DISCONNECTED');

      // Player 1 disconnects
      socket1.disconnect();

      // Player 2 should receive OPPONENT_DISCONNECTED
      const disconnectEvent = await disconnectPromise;
      expect(disconnectEvent.type).toBe('OPPONENT_DISCONNECTED');
      expect((disconnectEvent as { battleId: string }).battleId).toBe(battleId);
    }, 15000);

    it('should allow player to rejoin and receive battle state', async () => {
      // Player 1 disconnects
      socket1.disconnect();
      await waitForDisconnect(socket1);

      // Player 1 reconnects with new socket
      socket1 = connectSocket(user1AccessToken);

      // Set up listener before connecting — handleConnection may auto-send BATTLE_RESTORED
      const restoredPromise = waitForEvent(socket1, 'BATTLE_RESTORED');
      await waitForConnect(socket1);

      // May already be fulfilled by handleConnection, or need REJOIN
      socket1.emit('REJOIN', { battleId });

      const rejoinEvent = await restoredPromise;
      expect(rejoinEvent.type).toBe('BATTLE_RESTORED');
      expect((rejoinEvent as { battleId: string }).battleId).toBe(battleId);
      expect(
        (rejoinEvent as { currentState: string }).currentState
      ).toBeTruthy();
    });
  });
});
