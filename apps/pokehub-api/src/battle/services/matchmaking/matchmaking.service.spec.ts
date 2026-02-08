import { MatchmakingServiceProvider } from './matchmaking.service';
import {
  MATCHMAKING_SERVICE,
  type IMatchmakingService,
  type MatchResult,
} from './matchmaking.service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import {
  REDIS_SERVICE,
  type RedisService,
} from '@pokehub/backend/pokehub-redis';
import { AppLogger } from '@pokehub/backend/shared-logger';

describe('MatchmakingService', () => {
  let service: IMatchmakingService;

  // Only mock the methods used by MatchmakingService
  const mockRedisService: Partial<jest.Mocked<RedisService>> = {
    getUserQueueStatus: jest.fn(),
    getUserBattle: jest.fn(),
    joinQueue: jest.fn(),
    setUserQueueStatus: jest.fn(),
    clearUserQueueStatus: jest.fn(),
    popQueueEntries: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  const testUserId1 = 'user-123';
  const testUserId2 = 'user-456';
  const testFormat = 'gen9ou';
  const testTeamId1 = 'team-abc';
  const testTeamId2 = 'team-def';
  const testPackedTeam1 = 'Pikachu|Static|LightBall|Thunderbolt,VoltTackle';
  const testPackedTeam2 =
    'Charizard|Blaze|CharcoalBlaze|Flamethrower,DragonClaw';

  const createService = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingServiceProvider,
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

    return module.get<IMatchmakingService>(MATCHMAKING_SERVICE);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service = await createService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('joinQueue', () => {
    it('should add player, return position, and set queue status', async () => {
      mockRedisService.getUserQueueStatus!.mockResolvedValue(null);
      mockRedisService.getUserBattle!.mockResolvedValue(null);
      mockRedisService.joinQueue!.mockResolvedValue(1);

      const position = await service.joinQueue(
        testUserId1,
        testFormat,
        testTeamId1,
        testPackedTeam1
      );

      expect(position).toBe(1);
      expect(mockRedisService.joinQueue).toHaveBeenCalledWith(
        testFormat,
        expect.objectContaining({
          userId: testUserId1,
          teamId: testTeamId1,
          packedTeam: testPackedTeam1,
        })
      );
      expect(mockRedisService.setUserQueueStatus).toHaveBeenCalledWith(
        testUserId1,
        testFormat
      );
    });

    it('should remove from existing queue first if already queued', async () => {
      const existingFormat = 'gen8ou';
      mockRedisService.getUserQueueStatus!.mockResolvedValueOnce(
        existingFormat
      );
      mockRedisService.getUserQueueStatus!.mockResolvedValueOnce(
        existingFormat
      );
      mockRedisService.getUserBattle!.mockResolvedValue(null);
      mockRedisService.joinQueue!.mockResolvedValue(1);

      await service.joinQueue(
        testUserId1,
        testFormat,
        testTeamId1,
        testPackedTeam1
      );

      // Should have cleared the old queue status before joining new queue
      expect(mockRedisService.clearUserQueueStatus).toHaveBeenCalledWith(
        testUserId1
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('already in queue')
      );
    });

    it('should throw when player is in a battle', async () => {
      mockRedisService.getUserQueueStatus!.mockResolvedValue(null);
      mockRedisService.getUserBattle!.mockResolvedValue('battle-123');

      await expect(
        service.joinQueue(testUserId1, testFormat, testTeamId1, testPackedTeam1)
      ).rejects.toThrow('Already in a battle');

      expect(mockRedisService.joinQueue).not.toHaveBeenCalled();
    });

    it('should return correct position when joining queue', async () => {
      mockRedisService.getUserQueueStatus!.mockResolvedValue(null);
      mockRedisService.getUserBattle!.mockResolvedValue(null);
      mockRedisService.joinQueue!.mockResolvedValue(5);

      const position = await service.joinQueue(
        testUserId1,
        testFormat,
        testTeamId1,
        testPackedTeam1
      );

      expect(position).toBe(5);
    });
  });

  describe('leaveQueue', () => {
    it('should clear queue status when user is in queue', async () => {
      mockRedisService.getUserQueueStatus!.mockResolvedValue(testFormat);

      await service.leaveQueue(testUserId1);

      expect(mockRedisService.clearUserQueueStatus).toHaveBeenCalledWith(
        testUserId1
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('left')
      );
    });

    it('should return early if user not in queue', async () => {
      mockRedisService.getUserQueueStatus!.mockResolvedValue(null);

      await service.leaveQueue(testUserId1);

      expect(mockRedisService.clearUserQueueStatus).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('not in any queue')
      );
    });
  });

  describe('isInQueue', () => {
    it('should return true when user is in queue', async () => {
      mockRedisService.getUserQueueStatus!.mockResolvedValue(testFormat);

      const result = await service.isInQueue(testUserId1);

      expect(result).toBe(true);
    });

    it('should return false when user is not in queue', async () => {
      mockRedisService.getUserQueueStatus!.mockResolvedValue(null);

      const result = await service.isInQueue(testUserId1);

      expect(result).toBe(false);
    });
  });

  describe('findMatch', () => {
    const createQueueEntry = (
      userId: string,
      teamId: string,
      packedTeam: string
    ) => ({
      userId,
      teamId,
      packedTeam,
      joinedAt: Date.now(),
    });

    it('should return MatchResult when 2 valid players popped', async () => {
      const entry1 = createQueueEntry(
        testUserId1,
        testTeamId1,
        testPackedTeam1
      );
      const entry2 = createQueueEntry(
        testUserId2,
        testTeamId2,
        testPackedTeam2
      );

      mockRedisService.popQueueEntries!.mockResolvedValue([entry1, entry2]);
      mockRedisService.getUserQueueStatus!.mockImplementation((userId) => {
        if (userId === testUserId1 || userId === testUserId2) {
          return Promise.resolve(testFormat);
        }
        return Promise.resolve(null);
      });

      const result = await service.findMatch(testFormat);

      expect(result).not.toBeNull();
      expect(result?.player1.userId).toBe(testUserId1);
      expect(result?.player2.userId).toBe(testUserId2);
    });

    it('should clear queue status for both matched players', async () => {
      const entry1 = createQueueEntry(
        testUserId1,
        testTeamId1,
        testPackedTeam1
      );
      const entry2 = createQueueEntry(
        testUserId2,
        testTeamId2,
        testPackedTeam2
      );

      mockRedisService.popQueueEntries!.mockResolvedValue([entry1, entry2]);
      mockRedisService.getUserQueueStatus!.mockResolvedValue(testFormat);

      await service.findMatch(testFormat);

      expect(mockRedisService.clearUserQueueStatus).toHaveBeenCalledWith(
        testUserId1
      );
      expect(mockRedisService.clearUserQueueStatus).toHaveBeenCalledWith(
        testUserId2
      );
    });

    it('should return null when not enough players', async () => {
      mockRedisService.popQueueEntries!.mockResolvedValue(null);

      const result = await service.findMatch(testFormat);

      expect(result).toBeNull();
    });

    it('should return null when only one entry is popped', async () => {
      const entry1 = createQueueEntry(
        testUserId1,
        testTeamId1,
        testPackedTeam1
      );
      mockRedisService.popQueueEntries!.mockResolvedValue([entry1]);

      const result = await service.findMatch(testFormat);

      expect(result).toBeNull();
    });

    it('should return null and put back valid player when other player left (lazy removal)', async () => {
      const entry1 = createQueueEntry(
        testUserId1,
        testTeamId1,
        testPackedTeam1
      );
      const entry2 = createQueueEntry(
        testUserId2,
        testTeamId2,
        testPackedTeam2
      );

      mockRedisService.popQueueEntries!.mockResolvedValue([entry1, entry2]);
      // Player 1 is still in queue, player 2 left
      mockRedisService.getUserQueueStatus!.mockImplementation((userId) => {
        if (userId === testUserId1) {
          return Promise.resolve(testFormat);
        }
        return Promise.resolve(null); // Player 2 left
      });

      const result = await service.findMatch(testFormat);

      expect(result).toBeNull();
      // Player 1 should be put back in the queue
      expect(mockRedisService.joinQueue).toHaveBeenCalledWith(
        testFormat,
        entry1
      );
      // Player 2 should not be put back (they left)
      expect(mockRedisService.joinQueue).not.toHaveBeenCalledWith(
        testFormat,
        entry2
      );
    });

    it('should put back both players if both are still in queue but different format', async () => {
      const entry1 = createQueueEntry(
        testUserId1,
        testTeamId1,
        testPackedTeam1
      );
      const entry2 = createQueueEntry(
        testUserId2,
        testTeamId2,
        testPackedTeam2
      );

      mockRedisService.popQueueEntries!.mockResolvedValue([entry1, entry2]);
      // Both players are in a different format queue now
      mockRedisService.getUserQueueStatus!.mockResolvedValue('gen8ou');

      const result = await service.findMatch(testFormat);

      expect(result).toBeNull();
      // Both should be put back since neither is in the correct format
      expect(mockRedisService.joinQueue).not.toHaveBeenCalled();
    });

    it('should return correct player data in MatchResult', async () => {
      const entry1 = createQueueEntry(
        testUserId1,
        testTeamId1,
        testPackedTeam1
      );
      const entry2 = createQueueEntry(
        testUserId2,
        testTeamId2,
        testPackedTeam2
      );

      mockRedisService.popQueueEntries!.mockResolvedValue([entry1, entry2]);
      mockRedisService.getUserQueueStatus!.mockResolvedValue(testFormat);

      const result = (await service.findMatch(testFormat)) as MatchResult;

      expect(result.player1).toEqual({
        userId: testUserId1,
        teamId: testTeamId1,
        packedTeam: testPackedTeam1,
        rating: undefined,
        rd: undefined,
      });
      expect(result.player2).toEqual({
        userId: testUserId2,
        teamId: testTeamId2,
        packedTeam: testPackedTeam2,
        rating: undefined,
        rd: undefined,
      });
    });
  });
});
