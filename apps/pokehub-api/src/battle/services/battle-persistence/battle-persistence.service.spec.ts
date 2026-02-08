import { BattlePersistenceServiceProvider } from './battle-persistence.service';
import {
  BATTLE_PERSISTENCE_SERVICE,
  type IBattlePersistenceService,
  type SaveReplayData,
} from './battle-persistence.service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BATTLES_DB_SERVICE,
  type IBattlesDBService,
  type BattleReplay,
} from '@pokehub/backend/pokehub-battles-db';
import {
  REDIS_SERVICE,
  type RedisService,
} from '@pokehub/backend/pokehub-redis';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { BattleConfig } from '@pokehub/shared/pokemon-battle-types';

describe('BattlePersistenceService', () => {
  let service: IBattlePersistenceService;

  // Only mock the methods used by BattlePersistenceService
  const mockBattlesDbService: Partial<jest.Mocked<IBattlesDBService>> = {
    saveReplay: jest.fn(),
    deleteReplay: jest.fn(),
    getUserReplayCount: jest.fn(),
    getSavedReplays: jest.fn(),
    getReplay: jest.fn(),
  };

  const mockRedisService: Partial<jest.Mocked<RedisService>> = {
    getBattleSeed: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  // Test data
  const testUserId = 'user-123';
  const testBattleId = 'battle-abc';
  const testReplayId = 'replay-xyz';
  const testSeed = 'seed-12345';

  const createMockBattleConfig = (): BattleConfig => ({
    id: testBattleId,
    format: 'gen9ou',
    seed: testSeed,
    player1: {
      id: 'player-1',
      name: 'Player One',
      teamId: 'team-1',
      packedTeam: 'Pikachu|Static|LightBall|Thunderbolt',
    },
    player2: {
      id: 'player-2',
      name: 'Player Two',
      teamId: 'team-2',
      packedTeam: 'Charizard|Blaze|Charcoal|Flamethrower',
    },
  });

  const createMockSaveReplayData = (
    overrides?: Partial<SaveReplayData>
  ): SaveReplayData => ({
    battleId: testBattleId,
    config: createMockBattleConfig(),
    battleLog: [
      '|start',
      '|turn|1',
      '|move|p1a: Pikachu|Thunderbolt|p2a: Charizard',
    ],
    winnerId: 'player-1',
    playedAt: new Date('2024-01-15T12:00:00Z'),
    ...overrides,
  });

  const createMockBattleReplay = (
    overrides?: Partial<BattleReplay>
  ): BattleReplay => ({
    id: testReplayId,
    battleId: testBattleId,
    userId: testUserId,
    format: 'gen9ou',
    player1Id: 'player-1',
    player2Id: 'player-2',
    player1TeamId: 'team-1',
    player2TeamId: 'team-2',
    winnerId: 'player-1',
    battleLog: ['|start', '|turn|1'],
    seed: testSeed,
    playedAt: new Date('2024-01-15T12:00:00Z'),
    savedAt: new Date('2024-01-15T12:05:00Z'),
    ...overrides,
  });

  const createService = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattlePersistenceServiceProvider,
        {
          provide: BATTLES_DB_SERVICE,
          useValue: mockBattlesDbService,
        },
        {
          provide: REDIS_SERVICE,
          useValue: mockRedisService,
        },
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    return module.get<IBattlePersistenceService>(BATTLE_PERSISTENCE_SERVICE);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service = await createService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveReplay', () => {
    it('should fetch seed from Redis, map config fields, and delegate to DB', async () => {
      const saveData = createMockSaveReplayData();

      mockRedisService.getBattleSeed!.mockResolvedValue(testSeed);
      mockBattlesDbService.saveReplay!.mockResolvedValue({ replayCount: 3 });

      const result = await service.saveReplay(testUserId, saveData);

      expect(mockRedisService.getBattleSeed).toHaveBeenCalledWith(testBattleId);
      expect(mockBattlesDbService.saveReplay).toHaveBeenCalledWith({
        battleId: testBattleId,
        userId: testUserId,
        format: 'gen9ou',
        player1Id: 'player-1',
        player2Id: 'player-2',
        player1TeamId: 'team-1',
        player2TeamId: 'team-2',
        winnerId: 'player-1',
        battleLog: saveData.battleLog,
        seed: testSeed,
        playedAt: saveData.playedAt,
      });
      expect(result).toEqual({ replayCount: 3 });
    });

    it('should throw when seed not found in Redis', async () => {
      const saveData = createMockSaveReplayData();

      mockRedisService.getBattleSeed!.mockResolvedValue(null);

      await expect(service.saveReplay(testUserId, saveData)).rejects.toThrow(
        'Battle seed not found. Replay cannot be saved.'
      );

      expect(mockBattlesDbService.saveReplay).not.toHaveBeenCalled();
    });

    it('should handle null winnerId for draws', async () => {
      const saveData = createMockSaveReplayData({ winnerId: null });

      mockRedisService.getBattleSeed!.mockResolvedValue(testSeed);
      mockBattlesDbService.saveReplay!.mockResolvedValue({ replayCount: 1 });

      await service.saveReplay(testUserId, saveData);

      expect(mockBattlesDbService.saveReplay).toHaveBeenCalledWith(
        expect.objectContaining({
          winnerId: null,
        })
      );
    });

    it('should log the save operation', async () => {
      const saveData = createMockSaveReplayData();

      mockRedisService.getBattleSeed!.mockResolvedValue(testSeed);
      mockBattlesDbService.saveReplay!.mockResolvedValue({ replayCount: 5 });

      await service.saveReplay(testUserId, saveData);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining(`Saving replay for battle ${testBattleId}`)
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Replay saved')
      );
    });
  });

  describe('deleteReplay', () => {
    it('should delegate to DB service', async () => {
      mockBattlesDbService.deleteReplay!.mockResolvedValue(undefined);

      await service.deleteReplay(testReplayId, testUserId);

      expect(mockBattlesDbService.deleteReplay).toHaveBeenCalledWith(
        testReplayId,
        testUserId
      );
    });

    it('should log the delete operation', async () => {
      mockBattlesDbService.deleteReplay!.mockResolvedValue(undefined);

      await service.deleteReplay(testReplayId, testUserId);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining(`Deleting replay ${testReplayId}`)
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('deleted')
      );
    });
  });

  describe('getUserReplayCount', () => {
    it('should delegate to DB service', async () => {
      mockBattlesDbService.getUserReplayCount!.mockResolvedValue(7);

      const result = await service.getUserReplayCount(testUserId);

      expect(mockBattlesDbService.getUserReplayCount).toHaveBeenCalledWith(
        testUserId
      );
      expect(result).toBe(7);
    });

    it('should return 0 when user has no replays', async () => {
      mockBattlesDbService.getUserReplayCount!.mockResolvedValue(0);

      const result = await service.getUserReplayCount(testUserId);

      expect(result).toBe(0);
    });
  });

  describe('getSavedReplays', () => {
    it('should delegate to DB service', async () => {
      const replays = [
        createMockBattleReplay({ id: 'replay-1' }),
        createMockBattleReplay({ id: 'replay-2' }),
      ];
      mockBattlesDbService.getSavedReplays!.mockResolvedValue(replays);

      const result = await service.getSavedReplays(testUserId);

      expect(mockBattlesDbService.getSavedReplays).toHaveBeenCalledWith(
        testUserId
      );
      expect(result).toEqual(replays);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no replays', async () => {
      mockBattlesDbService.getSavedReplays!.mockResolvedValue([]);

      const result = await service.getSavedReplays(testUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getReplay', () => {
    it('should delegate to DB service', async () => {
      const replay = createMockBattleReplay();
      mockBattlesDbService.getReplay!.mockResolvedValue(replay);

      const result = await service.getReplay(testReplayId);

      expect(mockBattlesDbService.getReplay).toHaveBeenCalledWith(testReplayId);
      expect(result).toEqual(replay);
    });

    it('should return undefined when replay not found', async () => {
      mockBattlesDbService.getReplay!.mockResolvedValue(undefined);

      const result = await service.getReplay('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('canSaveReplay', () => {
    it('should return true when count < 10', async () => {
      mockBattlesDbService.getUserReplayCount!.mockResolvedValue(5);

      const result = await service.canSaveReplay(testUserId);

      expect(result).toBe(true);
    });

    it('should return true when count is 9 (at limit boundary)', async () => {
      mockBattlesDbService.getUserReplayCount!.mockResolvedValue(9);

      const result = await service.canSaveReplay(testUserId);

      expect(result).toBe(true);
    });

    it('should return false when count >= 10', async () => {
      mockBattlesDbService.getUserReplayCount!.mockResolvedValue(10);

      const result = await service.canSaveReplay(testUserId);

      expect(result).toBe(false);
    });

    it('should return false when count exceeds 10', async () => {
      mockBattlesDbService.getUserReplayCount!.mockResolvedValue(15);

      const result = await service.canSaveReplay(testUserId);

      expect(result).toBe(false);
    });

    it('should return true when user has no replays', async () => {
      mockBattlesDbService.getUserReplayCount!.mockResolvedValue(0);

      const result = await service.canSaveReplay(testUserId);

      expect(result).toBe(true);
    });
  });
});
