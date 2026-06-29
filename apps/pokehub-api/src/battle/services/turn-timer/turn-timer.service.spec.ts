import { TurnTimerServiceProvider } from './turn-timer.service';
import {
  TURN_TIMER_SERVICE,
  type ITurnTimerService,
  type TurnTimeoutCallback,
  type TurnWarningCallback,
} from './turn-timer.service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { TURN_TIMEOUT_SECONDS } from '@pokehub/shared/pokemon-battle-types';

const TIMEOUT_MS = TURN_TIMEOUT_SECONDS * 1000;
const WARNING_MS = TIMEOUT_MS / 2;
const WARNING_SECONDS = TURN_TIMEOUT_SECONDS / 2;

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

      // Advance to warning time from new start
      jest.advanceTimersByTime(WARNING_MS);

      // Now warning should fire
      expect(mockWarningCallback).toHaveBeenCalled();
    });
  });

  describe('warning callback', () => {
    it('should fire warning callback at half timeout with correct args', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      // Advance to just before warning time
      jest.advanceTimersByTime(WARNING_MS - 1);
      expect(mockWarningCallback).not.toHaveBeenCalled();

      // Advance to warning time
      jest.advanceTimersByTime(1);
      expect(mockWarningCallback).toHaveBeenCalledTimes(2); // Both p1 and p2

      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId, 'p1', WARNING_SECONDS);
      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId, 'p2', WARNING_SECONDS);
    });

    it('should only fire warning for player who has not chosen', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, true, false);

      jest.advanceTimersByTime(WARNING_MS);

      expect(mockWarningCallback).toHaveBeenCalledTimes(1);
      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId, 'p2', WARNING_SECONDS);
    });
  });

  describe('timeout callback', () => {
    it('should fire timeout callback at full timeout with correct args', () => {
      service.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      // Advance to just before timeout
      jest.advanceTimersByTime(TIMEOUT_MS - 1);
      expect(mockTimeoutCallback).not.toHaveBeenCalled();

      // Advance to timeout
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

      jest.advanceTimersByTime(TIMEOUT_MS);

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

      jest.advanceTimersByTime(TIMEOUT_MS);

      // Only p2 callbacks should have fired
      expect(mockWarningCallback).toHaveBeenCalledTimes(1);
      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId, 'p2', WARNING_SECONDS);

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

      jest.advanceTimersByTime(TIMEOUT_MS);

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

      jest.advanceTimersByTime(TIMEOUT_MS);

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

      jest.advanceTimersByTime(WARNING_MS);

      expect(mockWarningCallback).toHaveBeenCalledTimes(2);
      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId, 'p1', WARNING_SECONDS);
      expect(mockWarningCallback).toHaveBeenCalledWith(testBattleId2, 'p2', WARNING_SECONDS);
    });
  });

  describe('setCallbacks', () => {
    it('should not fire callbacks if not set', async () => {
      const freshService = await createService();
      // Don't call setCallbacks

      freshService.startTimers(testBattleId, testP1Id, testP2Id, false, false);

      // Should not throw when timers fire
      expect(() => jest.advanceTimersByTime(TIMEOUT_MS)).not.toThrow();
    });

    it('should allow updating callbacks', () => {
      const newWarningCallback = jest.fn().mockResolvedValue(undefined);
      const newTimeoutCallback = jest.fn().mockResolvedValue(undefined);

      service.setCallbacks(newWarningCallback, newTimeoutCallback);
      service.startTimers(testBattleId, testP1Id, testP2Id, false, true);

      jest.advanceTimersByTime(TIMEOUT_MS);

      expect(newWarningCallback).toHaveBeenCalled();
      expect(newTimeoutCallback).toHaveBeenCalled();
      expect(mockWarningCallback).not.toHaveBeenCalled();
      expect(mockTimeoutCallback).not.toHaveBeenCalled();
    });
  });
});
