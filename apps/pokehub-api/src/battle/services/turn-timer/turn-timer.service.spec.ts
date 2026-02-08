import { TurnTimerServiceProvider } from './turn-timer.service';
import {
  TURN_TIMER_SERVICE,
  type ITurnTimerService,
  type TurnTimeoutCallback,
  type TurnWarningCallback,
} from './turn-timer.service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from '@pokehub/backend/shared-logger';

describe('TurnTimerService', () => {
  let service: ITurnTimerService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  // Test data
  const testBattleId = 'battle-123';
  const testBattleId2 = 'battle-456';
  const testP1Id = 'player-1';
  const testP2Id = 'player-2';

  // Mock callbacks
  let mockWarningCallback: jest.MockedFunction<TurnWarningCallback>;
  let mockTimeoutCallback: jest.MockedFunction<TurnTimeoutCallback>;

  const createService = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnTimerServiceProvider,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    return module.get<ITurnTimerService>(TURN_TIMER_SERVICE);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockWarningCallback = jest.fn().mockResolvedValue(undefined);
    mockTimeoutCallback = jest.fn().mockResolvedValue(undefined);

    service = await createService();
    service.setCallbacks(mockWarningCallback, mockTimeoutCallback);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startTimers', () => {
    it('should start timers for players who have not chosen', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      expect(service.hasActiveTimer(testBattleId, 'p1')).toBe(true);
      expect(service.hasActiveTimer(testBattleId, 'p2')).toBe(true);
    });

    it('should not start timer for player who has already chosen', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, true, false);

      expect(service.hasActiveTimer(testBattleId, 'p1')).toBe(false);
      expect(service.hasActiveTimer(testBattleId, 'p2')).toBe(true);
    });

    it('should skip timer for p2 if p2 has already chosen', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, true);

      expect(service.hasActiveTimer(testBattleId, 'p1')).toBe(true);
      expect(service.hasActiveTimer(testBattleId, 'p2')).toBe(false);
    });

    it('should not start any timers if both players have chosen', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, true, true);

      expect(service.hasActiveTimer(testBattleId, 'p1')).toBe(false);
      expect(service.hasActiveTimer(testBattleId, 'p2')).toBe(false);
    });

    it('should clear existing timers when starting new ones for same player', () => {
      // Start initial timers
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      // Advance some time
      jest.advanceTimersByTime(10_000);

      // Start new timers (simulating new turn)
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      // Should not have fired callbacks yet (timer was reset)
      expect(mockWarningCallback).not.toHaveBeenCalled();

      // Advance to 30s from new start
      jest.advanceTimersByTime(30_000);

      // Now warning should fire
      expect(mockWarningCallback).toHaveBeenCalled();
    });
  });

  describe('warning callback', () => {
    it('should fire warning callback at 30 seconds with correct args', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      // Advance to just before 30s
      jest.advanceTimersByTime(29_999);
      expect(mockWarningCallback).not.toHaveBeenCalled();

      // Advance to 30s
      jest.advanceTimersByTime(1);
      expect(mockWarningCallback).toHaveBeenCalledTimes(2); // Both p1 and p2

      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId, 'p1', 30);
      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId, 'p2', 30);
    });

    it('should only fire warning for player who has not chosen', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, true, false);

      jest.advanceTimersByTime(30_000);

      expect(mockWarningCallback).toHaveBeenCalledTimes(1);
      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId, 'p2', 30);
    });
  });

  describe('timeout callback', () => {
    it('should fire timeout callback at 60 seconds with correct args', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      // Advance to just before 60s
      jest.advanceTimersByTime(59_999);
      expect(mockTimeoutCallback).not.toHaveBeenCalled();

      // Advance to 60s
      jest.advanceTimersByTime(1);
      expect(mockTimeoutCallback).toHaveBeenCalledTimes(2); // Both p1 and p2

      expect(mockTimeoutCallback).toHaveBeenCalledWith(
        testBattleId,
        'p1',
        testP1Id
      );
      expect(mockTimeoutCallback).toHaveBeenCalledWith(
        testBattleId,
        'p2',
        testP2Id
      );
    });

    it('should only fire timeout for player who has not chosen', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, true);

      jest.advanceTimersByTime(60_000);

      expect(mockTimeoutCallback).toHaveBeenCalledTimes(1);
      expect(mockTimeoutCallback).toHaveBeenCalledWith(
        testBattleId,
        'p1',
        testP1Id
      );
    });
  });

  describe('cancelPlayerTimer', () => {
    it('should cancel timer for specific player without affecting other', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      service.cancelPlayerTimer(testBattleId, 'p1');

      expect(service.hasActiveTimer(testBattleId, 'p1')).toBe(false);
      expect(service.hasActiveTimer(testBattleId, 'p2')).toBe(true);
    });

    it('should prevent warning and timeout callbacks after cancellation', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      service.cancelPlayerTimer(testBattleId, 'p1');

      jest.advanceTimersByTime(60_000);

      // Only p2 callbacks should have fired
      expect(mockWarningCallback).toHaveBeenCalledTimes(1);
      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId, 'p2', 30);

      expect(mockTimeoutCallback).toHaveBeenCalledTimes(1);
      expect(mockTimeoutCallback).toHaveBeenCalledWith(
        testBattleId,
        'p2',
        testP2Id
      );
    });

    it('should handle cancellation for non-existent battle gracefully', () => {
      // Should not throw
      expect(() =>
        service.cancelPlayerTimer('non-existent', 'p1')
      ).not.toThrow();
    });
  });

  describe('cancelBattleTimers', () => {
    it('should cancel all timers for a battle', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      service.cancelBattleTimers(testBattleId);

      expect(service.hasActiveTimer(testBattleId, 'p1')).toBe(false);
      expect(service.hasActiveTimer(testBattleId, 'p2')).toBe(false);
    });

    it('should remove battle from internal Map', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      service.cancelBattleTimers(testBattleId);

      // After cancellation, hasActiveTimer should return false
      // (battle no longer exists in map)
      expect(service.hasActiveTimer(testBattleId, 'p1')).toBe(false);
      expect(service.hasActiveTimer(testBattleId, 'p2')).toBe(false);
    });

    it('should prevent all callbacks after cancellation', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      service.cancelBattleTimers(testBattleId);

      jest.advanceTimersByTime(60_000);

      expect(mockWarningCallback).not.toHaveBeenCalled();
      expect(mockTimeoutCallback).not.toHaveBeenCalled();
    });

    it('should handle cancellation for non-existent battle gracefully', () => {
      expect(() => service.cancelBattleTimers('non-existent')).not.toThrow();
    });
  });

  describe('hasActiveTimer', () => {
    it('should return true when player has active timer', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, true);

      expect(service.hasActiveTimer(testBattleId, 'p1')).toBe(true);
      expect(service.hasActiveTimer(testBattleId, 'p2')).toBe(false);
    });

    it('should return false for non-existent battle', () => {
      expect(service.hasActiveTimer('non-existent', 'p1')).toBe(false);
    });

    it('should return false after timer fires', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, true);

      jest.advanceTimersByTime(60_000);

      expect(service.hasActiveTimer(testBattleId, 'p1')).toBe(false);
    });
  });

  describe('multiple battles', () => {
    it('should maintain independent timers for different battles', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);
      service.startTimers(testBattleId2, 'player-3', 'player-4', false, false);

      expect(service.hasActiveTimer(testBattleId, 'p1')).toBe(true);
      expect(service.hasActiveTimer(testBattleId2, 'p1')).toBe(true);

      // Cancel one battle's timers
      service.cancelBattleTimers(testBattleId);

      expect(service.hasActiveTimer(testBattleId, 'p1')).toBe(false);
      expect(service.hasActiveTimer(testBattleId2, 'p1')).toBe(true);
    });

    it('should fire callbacks for correct battles', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, true);
      service.startTimers(testBattleId2, 'player-3', 'player-4', true, false);

      jest.advanceTimersByTime(30_000);

      expect(mockWarningCallback).toHaveBeenCalledTimes(2);
      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId, 'p1', 30);
      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId2, 'p2', 30);
    });
  });

  describe('setCallbacks', () => {
    it('should not fire callbacks if not set', async () => {
      const freshService = await createService();
      // Don't call setCallbacks

      freshService.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      // Should not throw when timers fire
      expect(() => jest.advanceTimersByTime(60_000)).not.toThrow();
    });

    it('should allow updating callbacks', () => {
      const newWarningCallback = jest.fn().mockResolvedValue(undefined);
      const newTimeoutCallback = jest.fn().mockResolvedValue(undefined);

      service.setCallbacks(newWarningCallback, newTimeoutCallback);
      service.startTimers(testBattleId, testP1Id, testP2Id, false, true);

      jest.advanceTimersByTime(60_000);

      expect(newWarningCallback).toHaveBeenCalled();
      expect(newTimeoutCallback).toHaveBeenCalled();
      expect(mockWarningCallback).not.toHaveBeenCalled();
      expect(mockTimeoutCallback).not.toHaveBeenCalled();
    });
  });
});
