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
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import { io, type Socket } from 'socket.io-client';

/**
 * Separate E2E test file for WebSocket rate limiting.
 * This boots the app WITHOUT overriding WsThrottlerGuard,
 * so the real throttler is active.
 */
describe('Battle Rate Limiting (e2e)', () => {
  let app: INestApplication;
  let jwtService: IJwtAuthService;
  let usersDBService: IUsersDBService;
  let teamsDBService: ITeamsDBService;
  let redisService: RedisService;

  let testUser: UserJwtData;
  let accessToken: string;
  let teamId: string;
  let serverAddress: string;

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

  function connectSocket(token: string): Socket {
    return io(`${serverAddress}${BATTLE_NAMESPACE}`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });
  }

  function waitForConnect(socket: Socket, timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (socket.connected) {
        resolve();
        return;
      }
      const timer = setTimeout(
        () => reject(new Error('Socket connection timeout')),
        timeout
      );
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

  function collectEvents(
    socket: Socket,
    durationMs: number
  ): Promise<ServerBattleEvent[]> {
    return new Promise((resolve) => {
      const events: ServerBattleEvent[] = [];
      const handler = (e: ServerBattleEvent) => events.push(e);
      socket.on(BATTLE_EVENT, handler);
      setTimeout(() => {
        socket.off(BATTLE_EVENT, handler);
        resolve(events);
      }, durationMs);
    });
  }

  beforeAll(async () => {
    // Boot app with real throttler — no guard override
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const server = app.getHttpServer();
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === 'object' ? address?.port : 0;
    serverAddress = `http://localhost:${port}`;

    jwtService = app.get<IJwtAuthService>(JWT_AUTH_SERVICE);
    usersDBService = app.get<IUsersDBService>(USERS_DB_SERVICE);
    teamsDBService = app.get<ITeamsDBService>(TEAMS_DB_SERVICE);
    redisService = app.get<RedisService>(REDIS_SERVICE);

    let user = await usersDBService.getUserByEmail(
      'battle-ratelimit-e2e@test.com'
    );
    if (!user) {
      user = await usersDBService.createUser(
        'battle-ratelimit-e2e@test.com',
        'GOOGLE'
      );
    }

    testUser = {
      id: user.id,
      email: user.email,
      accountType: user.accountType,
      accountRole: user.accountRole,
    };

    accessToken = await jwtService.generateToken(testUser, 'ACCESS_TOKEN');

    const team = await teamsDBService.createTeam({
      userId: testUser.id,
      name: 'Rate Limit Test Team',
      generation: 9,
      format: 'anythinggoes',
      pokemon: [createMockPokemon()],
    });
    teamId = team.id;

    // Clean up any stale state
    await redisService.clearUserBattle(testUser.id);
    await redisService.clearUserQueueStatus(testUser.id);
    await redisService.removeFromQueue('gen9anythinggoes', testUser.id);
  }, 30000);

  afterAll(async () => {
    if (teamId) {
      try {
        await teamsDBService.deleteTeam(teamId, testUser.id);
      } catch {
        // Team might already be deleted
      }
    }
    await app.close();
  });

  it('should allow requests within the rate limit', async () => {
    const socket = connectSocket(accessToken);
    await waitForConnect(socket);

    // JOIN_QUEUE has @WsThrottle(10, 60000) — 10 per minute
    // Send 2 rapid requests — both should succeed
    const eventsPromise = collectEvents(socket, 1500);

    socket.emit('JOIN_QUEUE', {
      format: 'gen9anythinggoes',
      teamId,
    });

    // Wait for QUEUE_JOINED before leaving
    await new Promise<void>((resolve) => {
      socket.once(BATTLE_EVENT, (e: ServerBattleEvent) => {
        if (e.type === 'QUEUE_JOINED') resolve();
      });
    });

    // Leave and wait for QUEUE_LEFT before rejoining
    socket.emit('LEAVE_QUEUE', {});
    await new Promise<void>((resolve) => {
      socket.once(BATTLE_EVENT, (e: ServerBattleEvent) => {
        if (e.type === 'QUEUE_LEFT') resolve();
      });
    });

    socket.emit('JOIN_QUEUE', {
      format: 'gen9anythinggoes',
      teamId,
    });

    const events = await eventsPromise;
    const queueJoined = events.filter((e) => e.type === 'QUEUE_JOINED');
    const rateLimited = events.filter(
      (e) => e.type === 'ERROR' && (e as { code: string }).code === 'RATE_LIMITED'
    );

    expect(queueJoined.length).toBe(2);
    expect(rateLimited.length).toBe(0);

    socket.disconnect();
  });

  it('should rate limit when exceeding the limit', async () => {
    const socket = connectSocket(accessToken);
    await waitForConnect(socket);

    // FORFEIT has @WsThrottle(1, 5000) — 1 per 5 seconds
    // Send 3 rapid FORFEIT requests with a fake battleId
    // First should get FORFEIT_ERROR (no such battle), rest should get RATE_LIMITED
    const eventsPromise = collectEvents(socket, 2000);

    socket.emit('FORFEIT', { battleId: '00000000-0000-0000-0000-000000000001' });
    socket.emit('FORFEIT', { battleId: '00000000-0000-0000-0000-000000000001' });
    socket.emit('FORFEIT', { battleId: '00000000-0000-0000-0000-000000000001' });

    const events = await eventsPromise;
    const rateLimited = events.filter(
      (e) => e.type === 'ERROR' && (e as { code: string }).code === 'RATE_LIMITED'
    );

    expect(rateLimited.length).toBeGreaterThanOrEqual(1);
  });

  it('should include retry-after info in rate limit error', async () => {
    const socket = connectSocket(accessToken);
    await waitForConnect(socket);

    // FORFEIT: 1 per 5 seconds — send 2 rapid requests
    const eventsPromise = collectEvents(socket, 2000);

    socket.emit('FORFEIT', { battleId: '00000000-0000-0000-0000-000000000001' });
    socket.emit('FORFEIT', { battleId: '00000000-0000-0000-0000-000000000001' });

    const events = await eventsPromise;
    const rateLimited = events.find(
      (e) => e.type === 'ERROR' && (e as { code: string }).code === 'RATE_LIMITED'
    );

    expect(rateLimited).toBeDefined();
    expect((rateLimited as { message: string }).message).toMatch(
      /Please wait \d+ second/
    );
    expect((rateLimited as { recoverable: boolean }).recoverable).toBe(true);

    socket.disconnect();
  });

  it('should rate limit per user, not per socket', async () => {
    // Connect two sockets for the same user
    const socket1 = connectSocket(accessToken);
    const socket2 = connectSocket(accessToken);
    await Promise.all([waitForConnect(socket1), waitForConnect(socket2)]);

    // FORFEIT: 1 per 5 seconds — send 1 from each socket
    const events1Promise = collectEvents(socket1, 2000);
    const events2Promise = collectEvents(socket2, 2000);

    socket1.emit('FORFEIT', { battleId: '00000000-0000-0000-0000-000000000001' });
    socket2.emit('FORFEIT', { battleId: '00000000-0000-0000-0000-000000000001' });

    const [events1, events2] = await Promise.all([events1Promise, events2Promise]);
    const allEvents = [...events1, ...events2];

    const rateLimited = allEvents.filter(
      (e) => e.type === 'ERROR' && (e as { code: string }).code === 'RATE_LIMITED'
    );

    // One of the two requests should be rate limited
    expect(rateLimited.length).toBeGreaterThanOrEqual(1);

    socket1.disconnect();
    socket2.disconnect();
  });

  it('should allow requests again after the rate limit window expires', async () => {
    const socket = connectSocket(accessToken);
    await waitForConnect(socket);

    // MOVE has @WsThrottle(2, 1000) — 2 per second
    // Send 2 to hit the limit
    socket.emit('MOVE', { battleId: '00000000-0000-0000-0000-000000000001', choice: 'move 1' });
    socket.emit('MOVE', { battleId: '00000000-0000-0000-0000-000000000001', choice: 'move 1' });

    // Third should be rate limited
    const events1Promise = collectEvents(socket, 500);
    socket.emit('MOVE', { battleId: '00000000-0000-0000-0000-000000000001', choice: 'move 1' });
    const events1 = await events1Promise;
    const rateLimited1 = events1.filter(
      (e) => e.type === 'ERROR' && (e as { code: string }).code === 'RATE_LIMITED'
    );
    expect(rateLimited1.length).toBeGreaterThanOrEqual(1);

    // Wait for the 1-second window to expire (extra margin for timing)
    await new Promise((r) => setTimeout(r, 1500));

    // Should be allowed again
    const events2Promise = collectEvents(socket, 500);
    socket.emit('MOVE', { battleId: '00000000-0000-0000-0000-000000000001', choice: 'move 1' });
    const events2 = await events2Promise;
    const rateLimited2 = events2.filter(
      (e) => e.type === 'ERROR' && (e as { code: string }).code === 'RATE_LIMITED'
    );
    expect(rateLimited2.length).toBe(0);

    socket.disconnect();
  }, 10000);
});
