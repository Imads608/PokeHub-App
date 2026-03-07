import { Test } from '@nestjs/testing';
import { BattleGateway } from './battle.gateway';
import { WsJwtGuard, AuthenticatedSocket } from './guards/ws-jwt.guard';
import { WsThrottlerGuard } from './guards/ws-throttler.guard';
import { MATCHMAKING_SERVICE, IMatchmakingService } from './services/matchmaking/matchmaking.service.interface';
import { BATTLE_MANAGER_SERVICE, IBattleManagerService } from './services/battle-manager/battle-manager.service.interface';
import { BATTLE_PERSISTENCE_SERVICE, IBattlePersistenceService } from './services/battle-persistence/battle-persistence.service.interface';
import { BATTLE_SOCKET_BRIDGE_SERVICE, IBattleSocketBridgeService } from './services/battle-socket-bridge/battle-socket-bridge.service.interface';
import { MATCH_ORCHESTRATOR_SERVICE, IMatchOrchestratorService } from './services/match-orchestrator/match-orchestrator.service.interface';
import { REDIS_SERVICE, RedisService } from '@pokehub/backend/pokehub-redis';
import { TEAMS_DB_SERVICE, ITeamsDBService } from '@pokehub/backend/pokehub-teams-db';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { BATTLE_EVENT } from '@pokehub/shared/pokemon-battle-types';
import { JWT_AUTH_SERVICE } from '@pokehub/backend/shared-auth-utils';

function mockSocket(userId = 'u1'): AuthenticatedSocket {
  return {
    id: `socket-${userId}`,
    user: { userId, email: `${userId}@test.com` },
    emit: jest.fn(),
    join: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn(),
    disconnect: jest.fn(),
    handshake: { auth: { token: 'valid' }, headers: {}, query: {} },
  } as unknown as AuthenticatedSocket;
}

describe('BattleGateway', () => {
  let gateway: BattleGateway;
  let matchmaking: jest.Mocked<IMatchmakingService>;
  let battleManager: jest.Mocked<IBattleManagerService>;
  let bridge: jest.Mocked<IBattleSocketBridgeService>;
  let orchestrator: jest.Mocked<IMatchOrchestratorService>;
  let redis: jest.Mocked<Pick<RedisService, 'getUserBattle' | 'getBattleMetadata' | 'getBattleLog'>>;
  let teamsDb: jest.Mocked<Pick<ITeamsDBService, 'getTeam'>>;
  let persistence: jest.Mocked<Pick<IBattlePersistenceService, 'canSaveReplay' | 'saveReplay'>>;
  let wsJwtGuard: { validateClient: jest.Mock; canActivate: jest.Mock };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  const mockServer = {
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    wsJwtGuard = {
      validateClient: jest.fn().mockResolvedValue(true),
      canActivate: jest.fn().mockResolvedValue(true),
    };

    matchmaking = {
      joinQueue: jest.fn().mockResolvedValue(1),
      leaveQueue: jest.fn().mockResolvedValue(undefined),
      isInQueue: jest.fn().mockResolvedValue(false),
      findMatch: jest.fn().mockResolvedValue(null),
      getQueueCounts: jest.fn().mockResolvedValue({}),
    } as jest.Mocked<IMatchmakingService>;

    battleManager = {
      createBattle: jest.fn(),
      processChoice: jest.fn().mockResolvedValue(undefined),
      cancelChoice: jest.fn().mockResolvedValue(undefined),
      forfeit: jest.fn().mockResolvedValue(undefined),
      recoverBattle: jest.fn(),
      getBattle: jest.fn().mockReturnValue(undefined),
      isHostedLocally: jest.fn().mockReturnValue(false),
      handleDisconnect: jest.fn().mockResolvedValue(undefined),
      handleReconnect: jest.fn(),
      cancelBattle: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IBattleManagerService>;

    bridge = {
      setServer: jest.fn(),
      registerSocket: jest.fn(),
      unregisterSocket: jest.fn(),
      subscribeUser: jest.fn(),
      unsubscribeUser: jest.fn(),
      subscribeBattle: jest.fn(),
      emitToUser: jest.fn(),
      getSocketId: jest.fn(),
      getServer: jest.fn().mockReturnValue(mockServer),
      destroy: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IBattleSocketBridgeService>;

    orchestrator = {
      tryFindMatch: jest.fn().mockResolvedValue(undefined),
      declineMatch: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IMatchOrchestratorService>;

    redis = {
      getUserBattle: jest.fn().mockResolvedValue(null),
      getBattleMetadata: jest.fn().mockResolvedValue(null),
      getBattleLog: jest.fn().mockResolvedValue(''),
    };

    teamsDb = {
      getTeam: jest.fn(),
    };

    persistence = {
      canSaveReplay: jest.fn().mockResolvedValue(true),
      saveReplay: jest.fn().mockResolvedValue({ replayCount: 1 }),
    };

    const module = await Test.createTestingModule({
      providers: [
        BattleGateway,
        { provide: AppLogger, useValue: mockLogger },
        { provide: WsJwtGuard, useValue: wsJwtGuard },
        { provide: JWT_AUTH_SERVICE, useValue: {} },
        { provide: REDIS_SERVICE, useValue: redis },
        { provide: MATCHMAKING_SERVICE, useValue: matchmaking },
        { provide: BATTLE_MANAGER_SERVICE, useValue: battleManager },
        { provide: BATTLE_PERSISTENCE_SERVICE, useValue: persistence },
        { provide: TEAMS_DB_SERVICE, useValue: teamsDb },
        { provide: BATTLE_SOCKET_BRIDGE_SERVICE, useValue: bridge },
        { provide: MATCH_ORCHESTRATOR_SERVICE, useValue: orchestrator },
      ],
    })
      .overrideGuard(WsThrottlerGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    gateway = module.get(BattleGateway);
    gateway.server = mockServer as never;
  });

  // ── handleConnection ─────────────────────────────────────────────

  describe('handleConnection', () => {
    it('should reject invalid auth and disconnect', async () => {
      wsJwtGuard.validateClient.mockResolvedValue(false);
      const client = mockSocket('u1');

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(bridge.registerSocket).not.toHaveBeenCalled();
    });

    it('should register valid socket and subscribe user', async () => {
      const client = mockSocket('u1');

      await gateway.handleConnection(client);

      expect(bridge.registerSocket).toHaveBeenCalledWith('socket-u1', 'u1');
      expect(bridge.subscribeUser).toHaveBeenCalledWith('u1');
    });

    it('should send BATTLE_RESTORED when user has active battle', async () => {
      const client = mockSocket('u1');
      redis.getUserBattle.mockResolvedValue('b1');
      battleManager.getBattle.mockReturnValue({
        id: 'b1',
        config: {
          id: 'b1',
          format: 'gen9ou',
          player1: { id: 'u1', name: 'Ash', teamId: 't1', packedTeam: 'Pikachu|||Thunderbolt' },
          player2: { id: 'u2', name: 'Gary', teamId: 't2', packedTeam: 'Charizard|||Flamethrower' },
          seed: "1,2,3,4",
        },
        currentState: 'state',
        p1State: 'p1-state',
        p2State: 'p2-state',
      });

      await gateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'BATTLE_RESTORED',
        battleId: 'b1',
        currentState: 'p1-state',
      }));
    });
  });

  // ── handleDisconnect ─────────────────────────────────────────────

  describe('handleDisconnect', () => {
    it('should unsubscribe and unregister socket', async () => {
      const client = mockSocket('u1');

      await gateway.handleDisconnect(client);

      expect(bridge.unsubscribeUser).toHaveBeenCalledWith('u1');
      expect(bridge.unregisterSocket).toHaveBeenCalledWith('socket-u1', 'u1');
    });

    it('should handle battle disconnect when in battle', async () => {
      const client = mockSocket('u1');
      redis.getUserBattle.mockResolvedValue('b1');

      await gateway.handleDisconnect(client);

      expect(battleManager.handleDisconnect).toHaveBeenCalledWith('b1', 'u1');
    });

    it('should broadcast queue counts only when was in queue', async () => {
      const client = mockSocket('u1');
      matchmaking.isInQueue.mockResolvedValue(true);

      await gateway.handleDisconnect(client);

      expect(matchmaking.getQueueCounts).toHaveBeenCalled();
    });

    it('should not broadcast queue counts when was not in queue', async () => {
      const client = mockSocket('u1');
      matchmaking.isInQueue.mockResolvedValue(false);

      await gateway.handleDisconnect(client);

      expect(matchmaking.getQueueCounts).not.toHaveBeenCalled();
    });
  });

  // ── handleJoinQueue ──────────────────────────────────────────────

  describe('handleJoinQueue', () => {
    it('should emit error on invalid payload', async () => {
      const client = mockSocket('u1');

      await gateway.handleJoinQueue(client, { invalid: true });

      expect(client.emit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'ERROR',
        code: 'INVALID_INPUT',
      }));
    });

    it('should emit error when team not found', async () => {
      const client = mockSocket('u1');
      teamsDb.getTeam.mockResolvedValue(undefined);

      await gateway.handleJoinQueue(client, { format: 'gen9ou', teamId: '00000000-0000-0000-0000-000000000001' });

      expect(client.emit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'ERROR',
        code: 'TEAM_NOT_FOUND',
      }));
    });

    it('should emit error when team not owned by user', async () => {
      const client = mockSocket('u1');
      teamsDb.getTeam.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000002', userId: 'u-other', pokemon: [] } as never);

      await gateway.handleJoinQueue(client, { format: 'gen9ou', teamId: '00000000-0000-0000-0000-000000000002' });

      expect(client.emit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'ERROR',
        code: 'INVALID_TEAM',
      }));
    });
  });

  // ── handleLeaveQueue ─────────────────────────────────────────────

  describe('handleLeaveQueue', () => {
    it('should leave queue and emit QUEUE_LEFT', async () => {
      const client = mockSocket('u1');

      await gateway.handleLeaveQueue(client);

      expect(matchmaking.leaveQueue).toHaveBeenCalledWith('u1');
      expect(client.emit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'QUEUE_LEFT',
      }));
    });
  });

  // ── handleMove ───────────────────────────────────────────────────

  describe('handleMove', () => {
    it('should emit error on invalid payload', async () => {
      const client = mockSocket('u1');

      await gateway.handleMove(client, {});

      expect(client.emit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'ERROR',
        code: 'INVALID_INPUT',
      }));
    });

    it('should delegate to battleManager', async () => {
      const client = mockSocket('u1');

      await gateway.handleMove(client, { battleId: 'b1', choice: 'move 1' });

      expect(battleManager.processChoice).toHaveBeenCalledWith('b1', 'u1', 'move 1');
    });
  });

  // ── handleForfeit ────────────────────────────────────────────────

  describe('handleForfeit', () => {
    it('should emit error on invalid payload', async () => {
      const client = mockSocket('u1');

      await gateway.handleForfeit(client, {});

      expect(client.emit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'ERROR',
        code: 'INVALID_INPUT',
      }));
    });

    it('should delegate to battleManager', async () => {
      const client = mockSocket('u1');

      await gateway.handleForfeit(client, { battleId: 'b1' });

      expect(battleManager.forfeit).toHaveBeenCalledWith('b1', 'u1');
    });
  });

  // ── handleRejoin ─────────────────────────────────────────────────

  describe('handleRejoin', () => {
    it('should reconnect, join room, and emit BATTLE_RESTORED', async () => {
      const client = mockSocket('u1');
      battleManager.handleReconnect.mockResolvedValue({
        id: 'b1',
        config: {
          id: 'b1',
          format: 'gen9ou',
          player1: { id: 'u1', name: 'Ash', teamId: 't1', packedTeam: 'Pikachu|||Thunderbolt' },
          player2: { id: 'u2', name: 'Gary', teamId: 't2', packedTeam: 'Charizard|||Flamethrower' },
          seed: "1,2,3,4",
        },
        currentState: 'state',
        p1State: 'p1-state',
        p2State: 'p2-state',
      });

      await gateway.handleRejoin(client, { battleId: 'b1' });

      expect(battleManager.handleReconnect).toHaveBeenCalledWith('b1', 'u1');
      expect(client.join).toHaveBeenCalledWith('battle:b1');
      expect(bridge.subscribeBattle).toHaveBeenCalledWith('b1');
      expect(client.emit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'BATTLE_RESTORED',
        battleId: 'b1',
      }));
    });
  });

  // ── handleObserveQueue / handleUnobserveQueue ────────────────────

  describe('handleObserveQueue', () => {
    it('should join lobby room and emit current counts', async () => {
      const client = mockSocket('u1');
      matchmaking.getQueueCounts.mockResolvedValue({ gen9ou: 5 });

      await gateway.handleObserveQueue(client);

      expect(client.join).toHaveBeenCalledWith('lobby');
      expect(client.emit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'QUEUE_COUNTS',
        counts: { gen9ou: 5 },
      }));
    });
  });

  describe('handleUnobserveQueue', () => {
    it('should leave lobby room', () => {
      const client = mockSocket('u1');

      gateway.handleUnobserveQueue(client);

      expect(client.leave).toHaveBeenCalledWith('lobby');
    });
  });
});
