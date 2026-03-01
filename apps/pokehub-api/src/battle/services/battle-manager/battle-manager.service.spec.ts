import {
  TURN_TIMER_SERVICE,
  type ITurnTimerService,
} from '../turn-timer/turn-timer.service.interface';
import { BattleManagerServiceProvider } from './battle-manager.service';
import {
  BATTLE_MANAGER_SERVICE,
  type IBattleManagerService,
} from './battle-manager.service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import {
  REDIS_SERVICE,
  type RedisService,
} from '@pokehub/backend/pokehub-redis';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { BattleConfig } from '@pokehub/shared/pokemon-battle-types';

// Mock @pkmn/sim module
jest.mock('@pkmn/sim', () => {
  // Mock battle instance
  const mockP1Side = {
    autoChoose: jest.fn(),
    getChoice: jest.fn().mockReturnValue('move 1'),
    requestState: 'move' as string,
  };
  const mockP2Side = {
    autoChoose: jest.fn(),
    getChoice: jest.fn().mockReturnValue('move 2'),
    requestState: 'move' as string,
  };
  const mockBattle = {
    sides: [mockP1Side, mockP2Side],
    p1: mockP1Side,
    p2: mockP2Side,
    ended: false,
    winner: '' as string,
  };

  // Mock omniscient stream (full info for win/tie detection + replay)
  const mockOmniscientStream = {
    write: jest.fn().mockResolvedValue(undefined),
    [Symbol.asyncIterator]: jest.fn().mockImplementation(function* () {
      yield '|start';
      yield '|turn|1';
      yield '|request|{}';
    }),
  };

  // Mock per-player perspective streams (opponent info redacted)
  const mockP1Stream = {
    write: jest.fn(),
    [Symbol.asyncIterator]: jest.fn().mockImplementation(function* () {
      yield '|start';
      yield '|turn|1';
      yield '|request|{"active":[]}';
    }),
  };

  const mockP2Stream = {
    write: jest.fn(),
    [Symbol.asyncIterator]: jest.fn().mockImplementation(function* () {
      yield '|start';
      yield '|turn|1';
      yield '|request|{"active":[]}';
    }),
  };

  // Mock streams object
  const mockStreams = {
    omniscient: mockOmniscientStream,
    p1: mockP1Stream,
    p2: mockP2Stream,
  };

  // Mock BattleStream class
  const MockBattleStream = jest.fn().mockImplementation(() => ({
    battle: mockBattle,
  }));

  return {
    BattleStreams: {
      BattleStream: MockBattleStream,
      getPlayerStreams: jest.fn().mockReturnValue(mockStreams),
    },
  };
});

describe('BattleManagerService', () => {
  let service: IBattleManagerService;

  // Mock Redis service methods used by BattleManagerService
  const mockRedisService: Partial<jest.Mocked<RedisService>> = {
    getServerId: jest.fn().mockReturnValue('test-server-1'),
    createBattle: jest.fn().mockResolvedValue(undefined),
    setBattleSeed: jest.fn().mockResolvedValue(undefined),
    addServerBattle: jest.fn().mockResolvedValue(undefined),
    setUserBattle: jest.fn().mockResolvedValue(undefined),
    clearUserBattle: jest.fn().mockResolvedValue(undefined),
    getPendingChoices: jest.fn().mockResolvedValue({}),
    setPendingChoices: jest.fn().mockResolvedValue(undefined),
    appendBattleLog: jest.fn().mockResolvedValue(undefined),
    getBattleMetadata: jest.fn(),
    updateBattleMetadata: jest.fn().mockResolvedValue(undefined),
    getBattleSeed: jest.fn(),
    getBattleLog: jest.fn().mockResolvedValue([]),
    publishBattleUpdate: jest.fn().mockResolvedValue(undefined),
    setBattleLogTTL: jest.fn().mockResolvedValue(undefined),
    setBattleMetadataTTL: jest.fn().mockResolvedValue(undefined),
    setBattleSeedTTL: jest.fn().mockResolvedValue(undefined),
    removeServerBattle: jest.fn().mockResolvedValue(undefined),
    isServerAlive: jest.fn(),
    cleanupBattle: jest.fn().mockResolvedValue(undefined),
  };

  // Mock turn timer service
  const mockTurnTimerService: Partial<jest.Mocked<ITurnTimerService>> = {
    setCallbacks: jest.fn(),
    startTimers: jest.fn(),
    cancelPlayerTimer: jest.fn(),
    cancelBattleTimers: jest.fn(),
    hasActiveTimer: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  // Test data
  const testBattleId = 'battle-123';
  const testPlayer1Id = 'player-1';
  const testPlayer2Id = 'player-2';
  const testSeed = '12345,67890,11111,22222';

  const createMockBattleConfig = (
    overrides?: Partial<BattleConfig>
  ): BattleConfig => ({
    id: testBattleId,
    format: 'gen9ou',
    seed: testSeed,
    player1: {
      id: testPlayer1Id,
      name: 'Player One',
      teamId: 'team-1',
      packedTeam: 'Pikachu|Static|LightBall|Thunderbolt',
    },
    player2: {
      id: testPlayer2Id,
      name: 'Player Two',
      teamId: 'team-2',
      packedTeam: 'Charizard|Blaze|Charcoal|Flamethrower',
    },
    ...overrides,
  });

  const createService = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattleManagerServiceProvider,
        {
          provide: REDIS_SERVICE,
          useValue: mockRedisService,
        },
        {
          provide: TURN_TIMER_SERVICE,
          useValue: mockTurnTimerService,
        },
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    return module.get<IBattleManagerService>(BATTLE_MANAGER_SERVICE);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service = await createService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should register turn timer callbacks on initialization', () => {
      expect(mockTurnTimerService.setCallbacks).toHaveBeenCalledWith(
        expect.any(Function), // warning callback
        expect.any(Function) // timeout callback
      );
    });
  });

  describe('createBattle', () => {
    it('should create battle, store in Redis, set user battles, and start timers', async () => {
      const config = createMockBattleConfig();

      const result = await service.createBattle(config);

      // Returns ActiveBattle with per-player perspectives
      expect(result).toEqual({
        id: config.id,
        config,
        currentState: expect.any(String),
        p1State: expect.any(String),
        p2State: expect.any(String),
      });

      // Stores metadata in Redis
      expect(mockRedisService.createBattle).toHaveBeenCalledWith(config.id, {
        config: JSON.stringify(config),
        status: 'active',
        hostServer: 'test-server-1',
        pending: '{}',
        p1Disconnected: 'false',
        p2Disconnected: 'false',
      });

      // Stores seed
      expect(mockRedisService.setBattleSeed).toHaveBeenCalledWith(
        config.id,
        config.seed
      );

      // Tracks battle on server
      expect(mockRedisService.addServerBattle).toHaveBeenCalledWith(config.id);

      // Sets user battles
      expect(mockRedisService.setUserBattle).toHaveBeenCalledWith(
        config.player1.id,
        config.id
      );
      expect(mockRedisService.setUserBattle).toHaveBeenCalledWith(
        config.player2.id,
        config.id
      );

      // Starts turn timers
      expect(mockTurnTimerService.startTimers).toHaveBeenCalledWith(
        config.id,
        config.player1.id,
        config.player2.id,
        false,
        false
      );
    });
  });

  describe('processChoice', () => {
    beforeEach(async () => {
      // Create a battle first
      const config = createMockBattleConfig();
      await service.createBattle(config);
    });

    it('should store pending choice and cancel player timer', async () => {
      mockRedisService.getPendingChoices!.mockResolvedValue({});

      await service.processChoice(testBattleId, testPlayer1Id, 'move 1');

      expect(mockRedisService.setPendingChoices).toHaveBeenCalledWith(
        testBattleId,
        { p1: 'move 1' }
      );
      expect(mockRedisService.appendBattleLog).toHaveBeenCalledWith(
        testBattleId,
        '>p1 move 1'
      );
    });

    it('should throw when battle not found', async () => {
      await expect(
        service.processChoice('non-existent', testPlayer1Id, 'move 1')
      ).rejects.toThrow('Battle non-existent not found on this server');
    });

    it('should throw when player is not in battle', async () => {
      await expect(
        service.processChoice(testBattleId, 'unknown-player', 'move 1')
      ).rejects.toThrow('Player unknown-player is not in battle');
    });
  });

  describe('forfeit', () => {
    beforeEach(async () => {
      const config = createMockBattleConfig();
      await service.createBattle(config);
    });

    it('should end battle with other player as winner', async () => {
      await service.forfeit(testBattleId, testPlayer1Id);

      // Should log the forfeit
      expect(mockRedisService.appendBattleLog).toHaveBeenCalledWith(
        testBattleId,
        '>p1 forfeit'
      );

      // Should cancel timers
      expect(mockTurnTimerService.cancelBattleTimers).toHaveBeenCalledWith(
        testBattleId
      );

      // Should update status and winner
      expect(mockRedisService.updateBattleMetadata).toHaveBeenCalledWith(
        testBattleId,
        { status: 'forfeited', winnerId: testPlayer2Id }
      );

      // Should publish end event with player2 as winner
      expect(mockRedisService.publishBattleUpdate).toHaveBeenCalledWith(
        testBattleId,
        {
          type: 'end',
          data: { winnerId: testPlayer2Id, reason: 'forfeit' },
        }
      );

      // Should clear user battles
      expect(mockRedisService.clearUserBattle).toHaveBeenCalledWith(
        testPlayer1Id
      );
      expect(mockRedisService.clearUserBattle).toHaveBeenCalledWith(
        testPlayer2Id
      );
    });

    it('should throw when battle not found', async () => {
      await expect(
        service.forfeit('non-existent', testPlayer1Id)
      ).rejects.toThrow('Battle non-existent not found on this server');
    });

    it('should throw when player is not in battle', async () => {
      await expect(
        service.forfeit(testBattleId, 'unknown-player')
      ).rejects.toThrow('Player unknown-player is not in battle');
    });
  });

  describe('recoverBattle', () => {
    it('should recover battle from Redis, replay commands, and update host server', async () => {
      const config = createMockBattleConfig();
      const battleLog = ['>p1 move 1', '>p2 move 2'];

      mockRedisService.getBattleMetadata!.mockResolvedValue({
        config: JSON.stringify(config),
        status: 'active',
        hostServer: 'old-server',
        pending: '{}',
        p1Disconnected: 'false',
        p2Disconnected: 'false',
      });
      mockRedisService.getBattleSeed!.mockResolvedValue(testSeed);
      mockRedisService.getBattleLog!.mockResolvedValue(battleLog);

      const result = await service.recoverBattle(testBattleId);

      expect(result).toEqual({
        id: testBattleId,
        config,
        currentState: expect.any(String),
        p1State: expect.any(String),
        p2State: expect.any(String),
      });

      // Should update host server
      expect(mockRedisService.updateBattleMetadata).toHaveBeenCalledWith(
        testBattleId,
        { hostServer: 'test-server-1' }
      );

      // Should track battle on this server
      expect(mockRedisService.addServerBattle).toHaveBeenCalledWith(
        testBattleId
      );
    });

    it('should throw when metadata not found', async () => {
      mockRedisService.getBattleMetadata!.mockResolvedValue(null);

      await expect(service.recoverBattle(testBattleId)).rejects.toThrow(
        `Battle ${testBattleId} not found in Redis`
      );
    });

    it('should throw when seed not found', async () => {
      const config = createMockBattleConfig();

      mockRedisService.getBattleMetadata!.mockResolvedValue({
        config: JSON.stringify(config),
        status: 'active',
        hostServer: 'old-server',
        pending: '{}',
        p1Disconnected: 'false',
        p2Disconnected: 'false',
      });
      mockRedisService.getBattleSeed!.mockResolvedValue(null);

      await expect(service.recoverBattle(testBattleId)).rejects.toThrow(
        `Seed not found for battle ${testBattleId}`
      );
    });
  });

  describe('getBattle', () => {
    it('should return battle when exists locally', async () => {
      const config = createMockBattleConfig();
      await service.createBattle(config);

      const result = service.getBattle(testBattleId);

      expect(result).toEqual({
        id: testBattleId,
        config,
        currentState: expect.any(String),
        p1State: expect.any(String),
        p2State: expect.any(String),
      });
    });

    it('should return undefined when battle does not exist', () => {
      const result = service.getBattle('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('isHostedLocally', () => {
    it('should return true when battle is hosted locally', async () => {
      const config = createMockBattleConfig();
      await service.createBattle(config);

      expect(service.isHostedLocally(testBattleId)).toBe(true);
    });

    it('should return false when battle is not hosted locally', () => {
      expect(service.isHostedLocally('non-existent')).toBe(false);
    });
  });

  describe('handleDisconnect', () => {
    beforeEach(async () => {
      const config = createMockBattleConfig();
      await service.createBattle(config);
    });

    it('should set disconnect flag and publish event', async () => {
      await service.handleDisconnect(testBattleId, testPlayer1Id);

      // Should update metadata with disconnect flag and time
      expect(mockRedisService.updateBattleMetadata).toHaveBeenCalledWith(
        testBattleId,
        expect.objectContaining({
          p1Disconnected: 'true',
          p1DisconnectTime: expect.any(String),
        })
      );

      // Should publish opponent disconnected event
      expect(mockRedisService.publishBattleUpdate).toHaveBeenCalledWith(
        testBattleId,
        {
          type: 'event',
          targetUserId: testPlayer2Id,
          data: { event: 'opponent_disconnected', player: 'p1' },
        }
      );
    });

    it('should return early if battle not found locally', async () => {
      await service.handleDisconnect('non-existent', testPlayer1Id);

      expect(mockRedisService.updateBattleMetadata).not.toHaveBeenCalled();
    });
  });

  describe('handleReconnect', () => {
    beforeEach(async () => {
      const config = createMockBattleConfig();
      await service.createBattle(config);
    });

    it('should clear disconnect flag and publish event when battle is local', async () => {
      const result = await service.handleReconnect(testBattleId, testPlayer1Id);

      expect(result).toEqual({
        id: testBattleId,
        config: expect.any(Object),
        currentState: expect.any(String),
        p1State: expect.any(String),
        p2State: expect.any(String),
      });

      // Should clear disconnect flag
      expect(mockRedisService.updateBattleMetadata).toHaveBeenCalledWith(
        testBattleId,
        { p1Disconnected: 'false' }
      );

      // Should publish opponent reconnected event
      expect(mockRedisService.publishBattleUpdate).toHaveBeenCalledWith(
        testBattleId,
        {
          type: 'event',
          targetUserId: testPlayer2Id,
          data: { event: 'opponent_reconnected', player: 'p1' },
        }
      );
    });

    it('should throw when player is not in battle', async () => {
      await expect(
        service.handleReconnect(testBattleId, 'unknown-player')
      ).rejects.toThrow('Player unknown-player is not in battle');
    });
  });

  describe('endBattle (via forfeit)', () => {
    beforeEach(async () => {
      const config = createMockBattleConfig();
      await service.createBattle(config);
    });

    it('should cancel timers, update Redis, publish end event, clear user battles, and set log TTL', async () => {
      jest.clearAllMocks();

      await service.forfeit(testBattleId, testPlayer1Id);

      // Cancel timers
      expect(mockTurnTimerService.cancelBattleTimers).toHaveBeenCalledWith(
        testBattleId
      );

      // Update status and winner
      expect(mockRedisService.updateBattleMetadata).toHaveBeenCalledWith(
        testBattleId,
        { status: 'forfeited', winnerId: testPlayer2Id }
      );

      // Publish end event
      expect(mockRedisService.publishBattleUpdate).toHaveBeenCalledWith(
        testBattleId,
        expect.objectContaining({
          type: 'end',
        })
      );

      // Clear user battles
      expect(mockRedisService.clearUserBattle).toHaveBeenCalledTimes(2);

      // Set TTLs on all battle keys
      expect(mockRedisService.setBattleLogTTL).toHaveBeenCalledWith(
        testBattleId,
        3600
      );
      expect(mockRedisService.setBattleMetadataTTL).toHaveBeenCalledWith(
        testBattleId,
        3600
      );
      expect(mockRedisService.setBattleSeedTTL).toHaveBeenCalledWith(
        testBattleId,
        3600
      );

      // Battle should no longer be hosted locally
      expect(service.isHostedLocally(testBattleId)).toBe(false);
    });
  });

  describe('cancelBattle', () => {
    beforeEach(async () => {
      const config = createMockBattleConfig();
      await service.createBattle(config);
      jest.clearAllMocks();
    });

    it('should cancel timers, clear user battles, and cleanup Redis', async () => {
      await service.cancelBattle(testBattleId);

      // Should cancel all battle timers
      expect(mockTurnTimerService.cancelBattleTimers).toHaveBeenCalledWith(
        testBattleId
      );

      // Should clear user battles for both players
      expect(mockRedisService.clearUserBattle).toHaveBeenCalledWith(
        testPlayer1Id
      );
      expect(mockRedisService.clearUserBattle).toHaveBeenCalledWith(
        testPlayer2Id
      );

      // Should cleanup all Redis state
      expect(mockRedisService.cleanupBattle).toHaveBeenCalledWith(testBattleId);

      // Battle should no longer be hosted locally
      expect(service.isHostedLocally(testBattleId)).toBe(false);
    });

    it('should not throw when battle does not exist locally', async () => {
      // Should not throw, just cleanup Redis
      await expect(
        service.cancelBattle('non-existent-battle')
      ).resolves.not.toThrow();

      // Should still attempt Redis cleanup
      expect(mockRedisService.cleanupBattle).toHaveBeenCalledWith(
        'non-existent-battle'
      );
    });

    it('should NOT publish end event (unlike forfeit)', async () => {
      await service.cancelBattle(testBattleId);

      // Cancel should NOT publish battle end (no winner, no game played)
      expect(mockRedisService.publishBattleUpdate).not.toHaveBeenCalled();
    });

    it('should NOT set battle log TTL (battle never really started)', async () => {
      await service.cancelBattle(testBattleId);

      // No replay possible for cancelled battles
      expect(mockRedisService.setBattleLogTTL).not.toHaveBeenCalled();
    });
  });

  describe('per-player stream perspectives', () => {
    it('should return distinct p1State and p2State from createBattle', async () => {
      const config = createMockBattleConfig();
      const result = await service.createBattle(config);

      // Both perspective states should be populated
      expect(result.p1State).toBeTruthy();
      expect(result.p2State).toBeTruthy();
      // Omniscient state should also be populated
      expect(result.currentState).toBeTruthy();
    });

    it('should publish per-player data via Redis on executeTurn', async () => {
      const config = createMockBattleConfig();
      await service.createBattle(config);

      // Both players choose
      mockRedisService.getPendingChoices!.mockResolvedValue({});
      await service.processChoice(testBattleId, testPlayer1Id, 'move 1');

      mockRedisService.getPendingChoices!.mockResolvedValue({
        p1: 'move 1',
      });
      await service.processChoice(testBattleId, testPlayer2Id, 'move 2');

      // Should publish per-player perspective data
      expect(mockRedisService.publishBattleUpdate).toHaveBeenCalledWith(
        testBattleId,
        expect.objectContaining({
          type: 'state',
          p1Id: testPlayer1Id,
          p2Id: testPlayer2Id,
          p1Data: expect.any(String),
          p2Data: expect.any(String),
        })
      );
    });

    it('should include p1State and p2State in getBattle result', async () => {
      const config = createMockBattleConfig();
      await service.createBattle(config);

      const result = service.getBattle(testBattleId);

      expect(result).toBeDefined();
      expect(result!.p1State).toBeTruthy();
      expect(result!.p2State).toBeTruthy();
      expect(result!.currentState).toBeTruthy();
    });

    it('should include p1State and p2State in handleReconnect result', async () => {
      const config = createMockBattleConfig();
      await service.createBattle(config);

      const result = await service.handleReconnect(
        testBattleId,
        testPlayer1Id
      );

      expect(result.p1State).toBeTruthy();
      expect(result.p2State).toBeTruthy();
      expect(result.currentState).toBeTruthy();
    });
  });
});
