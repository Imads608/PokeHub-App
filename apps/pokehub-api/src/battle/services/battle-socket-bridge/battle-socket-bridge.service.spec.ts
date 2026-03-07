import { Test } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { BattleSocketBridgeServiceProvider } from './battle-socket-bridge.service';
import {
  BATTLE_SOCKET_BRIDGE_SERVICE,
  IBattleSocketBridgeService,
} from './battle-socket-bridge.service.interface';
import { REDIS_SERVICE } from '@pokehub/backend/pokehub-redis';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { BATTLE_EVENT } from '@pokehub/shared/pokemon-battle-types';

// EventEmitter extended with Redis client methods for mocking
interface MockSubscriber extends EventEmitter {
  subscribe: jest.Mock;
  unsubscribe: jest.Mock;
  quit: jest.Mock;
}

describe('BattleSocketBridgeService', () => {
  let service: IBattleSocketBridgeService;
  let mockSubscriber: MockSubscriber;
  let mockServer: { to: jest.Mock; emit: jest.Mock };
  let mockRedis: {
    createSubscriberClient: jest.Mock;
    refreshHeartbeat: jest.Mock;
    publishUserBattleEvent: jest.Mock;
  };
  let mockEmit: jest.Mock;
  let mockToEmit: jest.Mock;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    jest.useFakeTimers();

    const emitter = new EventEmitter() as MockSubscriber;
    emitter.subscribe = jest.fn().mockResolvedValue(undefined);
    emitter.unsubscribe = jest.fn().mockResolvedValue(undefined);
    emitter.quit = jest.fn().mockResolvedValue(undefined);
    mockSubscriber = emitter;

    mockToEmit = jest.fn();
    mockEmit = jest.fn();
    mockServer = {
      to: jest.fn().mockReturnValue({ emit: mockToEmit }),
      emit: mockEmit,
    };

    mockRedis = {
      createSubscriberClient: jest.fn().mockReturnValue(mockSubscriber),
      refreshHeartbeat: jest.fn().mockResolvedValue(undefined),
      publishUserBattleEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        BattleSocketBridgeServiceProvider,
        { provide: REDIS_SERVICE, useValue: mockRedis },
        { provide: AppLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<IBattleSocketBridgeService>(BATTLE_SOCKET_BRIDGE_SERVICE);
    service.setServer(mockServer as never);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ── Socket mapping ─────────────────────────────────────────────────

  describe('socket mapping', () => {
    it('registerSocket + getSocketId → returns socketId', () => {
      service.registerSocket('s1', 'u1');
      expect(service.getSocketId('u1')).toBe('s1');
    });

    it('unregisterSocket → removes mapping', () => {
      service.registerSocket('s1', 'u1');
      service.unregisterSocket('s1', 'u1');
      expect(service.getSocketId('u1')).toBeUndefined();
    });

    it('registerSocket when redisDown → emits SERVER_STATUS unavailable', () => {
      // Trigger redisDown
      mockSubscriber.emit('error', new Error('connection lost'));

      // Clear mock from the broadcast
      mockServer.to.mockClear();
      mockToEmit.mockClear();

      service.registerSocket('s1', 'u1');

      expect(mockServer.to).toHaveBeenCalledWith('s1');
      expect(mockToEmit).toHaveBeenCalledWith(BATTLE_EVENT, {
        type: 'SERVER_STATUS',
        status: 'unavailable',
      });
    });
  });

  // ── emitToUser ─────────────────────────────────────────────────────

  describe('emitToUser', () => {
    it('with local socket → emits directly', () => {
      service.registerSocket('s1', 'u1');
      service.emitToUser('u1', { type: 'QUEUE_LEFT' });

      expect(mockServer.to).toHaveBeenCalledWith('s1');
      expect(mockToEmit).toHaveBeenCalledWith(BATTLE_EVENT, { type: 'QUEUE_LEFT' });
    });

    it('without local socket → publishes via Redis', () => {
      service.emitToUser('u-remote', { type: 'QUEUE_LEFT' });

      expect(mockRedis.publishUserBattleEvent).toHaveBeenCalledWith(
        'u-remote',
        { type: 'QUEUE_LEFT' }
      );
    });
  });

  // ── Redis message routing ──────────────────────────────────────────

  describe('Redis message routing', () => {
    it('user battle event with local socket → forwards to socket', () => {
      service.registerSocket('s1', 'u1');
      const event = { type: 'MATCH_FOUND', battleId: 'b1', opponent: { id: 'u2', name: 'Gary' } };

      mockSubscriber.emit('message', 'user:u1:battle-events', JSON.stringify(event));

      expect(mockServer.to).toHaveBeenCalledWith('s1');
      expect(mockToEmit).toHaveBeenCalledWith(BATTLE_EVENT, event);
    });

    it('user battle event without local socket → logs warning', () => {
      const event = { type: 'MATCH_FOUND', battleId: 'b1', opponent: { id: 'u2', name: 'Gary' } };

      mockSubscriber.emit('message', 'user:u-remote:battle-events', JSON.stringify(event));

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('no socket found')
      );
    });

    it('battle state update → emits to p1 and p2 separately', () => {
      service.registerSocket('s1', 'u1');
      service.registerSocket('s2', 'u2');

      const message = {
        type: 'state',
        p1Id: 'u1',
        p2Id: 'u2',
        p1Data: 'data-for-p1',
        p2Data: 'data-for-p2',
      };

      mockSubscriber.emit('message', 'battle:b1:update', JSON.stringify(message));

      const calls = mockToEmit.mock.calls;
      const p1Call = calls.find((c: [string, { data?: string }]) => c[1]?.data === 'data-for-p1');
      const p2Call = calls.find((c: [string, { data?: string }]) => c[1]?.data === 'data-for-p2');
      expect(p1Call).toBeDefined();
      expect(p2Call).toBeDefined();
    });

    it('battle event: opponent_disconnected → emits to target user', () => {
      service.registerSocket('s1', 'u1');

      const message = {
        type: 'event',
        targetUserId: 'u1',
        data: { event: 'opponent_disconnected', player: 'p2' },
      };

      mockSubscriber.emit('message', 'battle:b1:update', JSON.stringify(message));

      expect(mockToEmit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'OPPONENT_DISCONNECTED',
        battleId: 'b1',
        timeout: 120,
      }));
    });

    it('battle event: opponent_reconnected → emits to target user', () => {
      service.registerSocket('s1', 'u1');

      const message = {
        type: 'event',
        targetUserId: 'u1',
        data: { event: 'opponent_reconnected', player: 'p2' },
      };

      mockSubscriber.emit('message', 'battle:b1:update', JSON.stringify(message));

      expect(mockToEmit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'OPPONENT_RECONNECTED',
        battleId: 'b1',
      }));
    });

    it('battle event: turn_warning → emits to target user', () => {
      service.registerSocket('s1', 'u1');

      const message = {
        type: 'event',
        targetUserId: 'u1',
        data: { event: 'turn_warning', player: 'p1', secondsRemaining: 15 },
      };

      mockSubscriber.emit('message', 'battle:b1:update', JSON.stringify(message));

      expect(mockToEmit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'TURN_WARNING',
        battleId: 'b1',
        secondsRemaining: 15,
      }));
    });

    it('battle end → emits to room and unsubscribes', () => {
      const message = {
        type: 'end',
        data: { winnerId: 'u1', reason: 'win' },
      };

      mockSubscriber.emit('message', 'battle:b1:update', JSON.stringify(message));

      expect(mockServer.to).toHaveBeenCalledWith('battle:b1');
      expect(mockToEmit).toHaveBeenCalledWith(BATTLE_EVENT, expect.objectContaining({
        type: 'BATTLE_END',
        battleId: 'b1',
        winner: 'u1',
        reason: 'win',
        canSaveReplay: true,
      }));

      expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith('battle:b1:update');
    });

    it('malformed JSON → logs error, no crash', () => {
      mockSubscriber.emit('message', 'user:u1:battle-events', 'not-json{{{');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error handling Redis message')
      );
    });
  });

  // ── Redis status ───────────────────────────────────────────────────

  describe('Redis status', () => {
    it('ready when previously down → broadcasts restored', () => {
      mockSubscriber.emit('error', new Error('lost'));
      mockEmit.mockClear();

      mockSubscriber.emit('ready');

      expect(mockEmit).toHaveBeenCalledWith(BATTLE_EVENT, {
        type: 'SERVER_STATUS',
        status: 'restored',
      });
    });

    it('error → broadcasts unavailable', () => {
      mockSubscriber.emit('error', new Error('connection lost'));

      expect(mockEmit).toHaveBeenCalledWith(BATTLE_EVENT, {
        type: 'SERVER_STATUS',
        status: 'unavailable',
      });
    });

    it('end → broadcasts unavailable', () => {
      mockSubscriber.emit('end');

      expect(mockEmit).toHaveBeenCalledWith(BATTLE_EVENT, {
        type: 'SERVER_STATUS',
        status: 'unavailable',
      });
    });

    it('ready when NOT previously down → does not broadcast', () => {
      mockSubscriber.emit('ready');

      expect(mockEmit).not.toHaveBeenCalledWith(BATTLE_EVENT, {
        type: 'SERVER_STATUS',
        status: 'restored',
      });
    });
  });

  // ── Lifecycle ──────────────────────────────────────────────────────

  describe('lifecycle', () => {
    it('destroy clears heartbeat interval and quits subscriber', async () => {
      await service.destroy();

      expect(mockSubscriber.quit).toHaveBeenCalled();
    });

    it('heartbeat fires on interval', () => {
      expect(mockRedis.refreshHeartbeat).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(5000);
      expect(mockRedis.refreshHeartbeat).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(5000);
      expect(mockRedis.refreshHeartbeat).toHaveBeenCalledTimes(3);
    });
  });
});
