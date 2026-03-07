import { Test } from '@nestjs/testing';
import { MatchOrchestratorServiceProvider } from './match-orchestrator.service';
import {
  MATCH_ORCHESTRATOR_SERVICE,
  IMatchOrchestratorService,
} from './match-orchestrator.service.interface';
import {
  MATCHMAKING_SERVICE,
  IMatchmakingService,
} from '../matchmaking/matchmaking.service.interface';
import {
  BATTLE_MANAGER_SERVICE,
  IBattleManagerService,
} from '../battle-manager/battle-manager.service.interface';
import {
  BATTLE_SOCKET_BRIDGE_SERVICE,
  IBattleSocketBridgeService,
} from '../battle-socket-bridge/battle-socket-bridge.service.interface';
import { REDIS_SERVICE, RedisService } from '@pokehub/backend/pokehub-redis';
import {
  USERS_DB_SERVICE,
  IUsersDBService,
} from '@pokehub/backend/pokehub-users-db';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { User } from '@pokehub/backend/pokehub-users-db';

function fakeUser(overrides: Partial<User> & { id: string }): User {
  return {
    username: null,
    email: 'test@test.com',
    accountRole: 'USER',
    accountType: 'GOOGLE',
    avatarFilename: null,
    ...overrides,
  };
}

describe('MatchOrchestratorService', () => {
  let service: IMatchOrchestratorService;
  let matchmaking: jest.Mocked<Pick<IMatchmakingService, 'findMatch' | 'joinQueue'>>;
  let battleManager: jest.Mocked<Pick<IBattleManagerService, 'createBattle' | 'cancelBattle'>>;
  let bridge: jest.Mocked<Pick<IBattleSocketBridgeService, 'subscribeBattle' | 'getServer' | 'getSocketId' | 'emitToUser'>>;
  let redis: jest.Mocked<Pick<RedisService, 'getBattleMetadata'>>;
  let usersDb: jest.Mocked<Pick<IUsersDBService, 'getUser'>>;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  const mockJoin = jest.fn();
  const mockFetchSockets = jest.fn().mockResolvedValue([{ join: mockJoin }]);
  const mockIn = jest.fn().mockReturnValue({ fetchSockets: mockFetchSockets });
  const mockServer = { in: mockIn } as unknown as ReturnType<IBattleSocketBridgeService['getServer']>;

  beforeEach(async () => {
    jest.clearAllMocks();

    matchmaking = {
      findMatch: jest.fn(),
      joinQueue: jest.fn(),
    };

    battleManager = {
      createBattle: jest.fn(),
      cancelBattle: jest.fn(),
    };

    bridge = {
      subscribeBattle: jest.fn(),
      getServer: jest.fn().mockReturnValue(mockServer),
      getSocketId: jest.fn(),
      emitToUser: jest.fn(),
    };

    redis = {
      getBattleMetadata: jest.fn(),
    };

    usersDb = {
      getUser: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        MatchOrchestratorServiceProvider,
        { provide: AppLogger, useValue: mockLogger },
        { provide: MATCHMAKING_SERVICE, useValue: matchmaking },
        { provide: BATTLE_MANAGER_SERVICE, useValue: battleManager },
        { provide: BATTLE_SOCKET_BRIDGE_SERVICE, useValue: bridge },
        { provide: REDIS_SERVICE, useValue: redis },
        { provide: USERS_DB_SERVICE, useValue: usersDb },
      ],
    }).compile();

    service = module.get<IMatchOrchestratorService>(MATCH_ORCHESTRATOR_SERVICE);
  });

  describe('tryFindMatch', () => {
    const matchResult = {
      player1: { userId: 'u1', teamId: 't1', packedTeam: 'Pikachu|||Thunderbolt' },
      player2: { userId: 'u2', teamId: 't2', packedTeam: 'Charizard|||Flamethrower' },
    };

    it('should return early when findMatch returns null', async () => {
      matchmaking.findMatch.mockResolvedValue(null);

      await service.tryFindMatch('gen9ou');

      expect(usersDb.getUser).not.toHaveBeenCalled();
      expect(battleManager.createBattle).not.toHaveBeenCalled();
    });

    it('should look up both users and create a battle when match found', async () => {
      matchmaking.findMatch.mockResolvedValue(matchResult);
      usersDb.getUser.mockImplementation((id: string) =>
        Promise.resolve(
          id === 'u1'
            ? fakeUser({ id: 'u1', username: 'Ash' })
            : fakeUser({ id: 'u2', username: 'Gary' })
        )
      );
      battleManager.createBattle.mockResolvedValue({
        id: 'b1',
        config: {} as never,
        currentState: '',
        p1State: 'state1',
        p2State: 'state2',
      });
      bridge.getSocketId.mockReturnValue('sock-1');

      await service.tryFindMatch('gen9ou');

      expect(usersDb.getUser).toHaveBeenCalledWith('u1');
      expect(usersDb.getUser).toHaveBeenCalledWith('u2');
      expect(battleManager.createBattle).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'gen9ou',
          player1: expect.objectContaining({ id: 'u1', name: 'Ash' }),
          player2: expect.objectContaining({ id: 'u2', name: 'Gary' }),
        })
      );
    });

    it('should return early when user lookup returns null', async () => {
      matchmaking.findMatch.mockResolvedValue(matchResult);
      usersDb.getUser.mockResolvedValue(undefined);

      await service.tryFindMatch('gen9ou');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get user info')
      );
      expect(battleManager.createBattle).not.toHaveBeenCalled();
    });

    it('should fallback username to Player {userId.slice(0,8)}', async () => {
      matchmaking.findMatch.mockResolvedValue(matchResult);
      usersDb.getUser.mockImplementation((id: string) =>
        Promise.resolve(
          id === 'u1'
            ? fakeUser({ id: 'u1' })
            : fakeUser({ id: 'u2', username: 'Gary' })
        )
      );
      battleManager.createBattle.mockResolvedValue({
        id: 'b1',
        config: {} as never,
        currentState: '',
        p1State: 's1',
        p2State: 's2',
      });
      bridge.getSocketId.mockReturnValue(undefined);

      await service.tryFindMatch('gen9ou');

      expect(battleManager.createBattle).toHaveBeenCalledWith(
        expect.objectContaining({
          player1: expect.objectContaining({ name: 'Player u1' }),
        })
      );
    });

    it('should subscribe to battle and join sockets to room', async () => {
      matchmaking.findMatch.mockResolvedValue(matchResult);
      usersDb.getUser.mockResolvedValue(fakeUser({ id: 'u1', username: 'Ash' }));
      battleManager.createBattle.mockResolvedValue({
        id: 'b1',
        config: {} as never,
        currentState: '',
        p1State: 's1',
        p2State: 's2',
      });
      bridge.getSocketId.mockReturnValue('sock-1');

      await service.tryFindMatch('gen9ou');

      expect(bridge.subscribeBattle).toHaveBeenCalled();
      expect(mockJoin).toHaveBeenCalled();
    });

    it('should skip room join when getSocketId returns undefined', async () => {
      matchmaking.findMatch.mockResolvedValue(matchResult);
      usersDb.getUser.mockResolvedValue(fakeUser({ id: 'u1', username: 'Ash' }));
      battleManager.createBattle.mockResolvedValue({
        id: 'b1',
        config: {} as never,
        currentState: '',
        p1State: 's1',
        p2State: 's2',
      });
      bridge.getSocketId.mockReturnValue(undefined);

      await service.tryFindMatch('gen9ou');

      expect(mockIn).not.toHaveBeenCalled();
    });

    it('should emit MATCH_FOUND then BATTLE_START to each player', async () => {
      matchmaking.findMatch.mockResolvedValue(matchResult);
      usersDb.getUser.mockImplementation((id: string) =>
        Promise.resolve(
          id === 'u1'
            ? fakeUser({ id: 'u1', username: 'Ash' })
            : fakeUser({ id: 'u2', username: 'Gary' })
        )
      );
      battleManager.createBattle.mockResolvedValue({
        id: 'b1',
        config: {} as never,
        currentState: '',
        p1State: 'state1',
        p2State: 'state2',
      });
      bridge.getSocketId.mockReturnValue(undefined);

      await service.tryFindMatch('gen9ou');

      const calls = bridge.emitToUser.mock.calls;
      // Player 1: MATCH_FOUND then BATTLE_START
      expect(calls[0][0]).toBe('u1');
      expect(calls[0][1]).toEqual(expect.objectContaining({ type: 'MATCH_FOUND' }));
      expect(calls[0][1]).toEqual(expect.objectContaining({ opponent: { id: 'u2', name: 'Gary' } }));
      expect(calls[1][0]).toBe('u1');
      expect(calls[1][1]).toEqual(expect.objectContaining({ type: 'BATTLE_START', initialState: 'state1' }));

      // Player 2: MATCH_FOUND then BATTLE_START
      expect(calls[2][0]).toBe('u2');
      expect(calls[2][1]).toEqual(expect.objectContaining({ type: 'MATCH_FOUND' }));
      expect(calls[2][1]).toEqual(expect.objectContaining({ opponent: { id: 'u1', name: 'Ash' } }));
      expect(calls[3][0]).toBe('u2');
      expect(calls[3][1]).toEqual(expect.objectContaining({ type: 'BATTLE_START', initialState: 'state2' }));
    });

    it('should log error and not emit when createBattle throws', async () => {
      matchmaking.findMatch.mockResolvedValue(matchResult);
      usersDb.getUser.mockResolvedValue(fakeUser({ id: 'u1', username: 'Ash' }));
      battleManager.createBattle.mockRejectedValue(new Error('sim crash'));
      bridge.getSocketId.mockReturnValue(undefined);

      await service.tryFindMatch('gen9ou');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create battle')
      );
      expect(bridge.emitToUser).not.toHaveBeenCalled();
    });
  });

  describe('declineMatch', () => {
    const battleConfig = {
      id: 'b1',
      format: 'gen9ou',
      player1: { id: 'u1', name: 'Ash', teamId: 't1', packedTeam: 'pk1' },
      player2: { id: 'u2', name: 'Gary', teamId: 't2', packedTeam: 'pk2' },
    };

    it('should warn and return when getBattleMetadata returns null', async () => {
      redis.getBattleMetadata.mockResolvedValue(null);

      await service.declineMatch('u1', 'b1');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('non-existent battle')
      );
      expect(battleManager.cancelBattle).not.toHaveBeenCalled();
    });

    it('should warn and return when userId is not in the battle', async () => {
      redis.getBattleMetadata.mockResolvedValue({
        config: JSON.stringify(battleConfig),
        status: 'active',
        hostServer: 'srv1',
        pending: '{}',
        p1Disconnected: 'false',
        p2Disconnected: 'false',
      });

      await service.declineMatch('u-other', 'b1');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("they're not in")
      );
      expect(battleManager.cancelBattle).not.toHaveBeenCalled();
    });

    it('should cancel battle and emit MATCH_CANCELLED to opponent', async () => {
      redis.getBattleMetadata.mockResolvedValue({
        config: JSON.stringify(battleConfig),
        status: 'active',
        hostServer: 'srv1',
        pending: '{}',
        p1Disconnected: 'false',
        p2Disconnected: 'false',
      });
      matchmaking.findMatch.mockResolvedValue(null);

      await service.declineMatch('u1', 'b1');

      expect(battleManager.cancelBattle).toHaveBeenCalledWith('b1');
      expect(bridge.emitToUser).toHaveBeenCalledWith('u2', {
        type: 'MATCH_CANCELLED',
        battleId: 'b1',
        reason: 'opponent_declined',
      });
    });

    it('should requeue opponent with original format/team', async () => {
      redis.getBattleMetadata.mockResolvedValue({
        config: JSON.stringify(battleConfig),
        status: 'active',
        hostServer: 'srv1',
        pending: '{}',
        p1Disconnected: 'false',
        p2Disconnected: 'false',
      });
      matchmaking.findMatch.mockResolvedValue(null);

      await service.declineMatch('u1', 'b1');

      expect(matchmaking.joinQueue).toHaveBeenCalledWith(
        'u2',
        'gen9ou',
        't2',
        'pk2'
      );
    });

    it('should call tryFindMatch for requeued opponent', async () => {
      redis.getBattleMetadata.mockResolvedValue({
        config: JSON.stringify(battleConfig),
        status: 'active',
        hostServer: 'srv1',
        pending: '{}',
        p1Disconnected: 'false',
        p2Disconnected: 'false',
      });
      matchmaking.findMatch.mockResolvedValue(null);

      await service.declineMatch('u1', 'b1');

      expect(matchmaking.findMatch).toHaveBeenCalledWith('gen9ou');
    });

    it('should work when player2 declines (opponent is player1)', async () => {
      redis.getBattleMetadata.mockResolvedValue({
        config: JSON.stringify(battleConfig),
        status: 'active',
        hostServer: 'srv1',
        pending: '{}',
        p1Disconnected: 'false',
        p2Disconnected: 'false',
      });
      matchmaking.findMatch.mockResolvedValue(null);

      await service.declineMatch('u2', 'b1');

      expect(bridge.emitToUser).toHaveBeenCalledWith('u1', expect.objectContaining({
        type: 'MATCH_CANCELLED',
      }));
      expect(matchmaking.joinQueue).toHaveBeenCalledWith(
        'u1',
        'gen9ou',
        't1',
        'pk1'
      );
    });
  });
});
