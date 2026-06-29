import { Test } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { BattleSocketBridgeServiceProvider } from './battle-socket-bridge.service';
import {
  BATTLE_SOCKET_BRIDGE_SERVICE,
  IBattleSocketBridgeService,
} from './battle-socket-bridge.service.interface';
import { REDIS_SERVICE } from '@pokehub/backend/pokehub-redis';
import { BATTLE_MANAGER_SERVICE } from '../battle-manager/battle-manager.service.interface';
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
  let mockServer: { to: jest.Mock; in: jest.Mock; emit: jest.Mock };
  let mockRedis: {
    createSubscriberClient: jest.Mock;
    refreshHeartbeat: jest.Mock;
    publishUserBattleEvent: jest.Mock;
  };
  let mockBattleManager: {
    isHostedLocally: jest.Mock;
    processChoice: jest.Mock;
    forfeit: jest.Mock;
    cancelChoice: jest.Mock;
    handleDisconnect: jest.Mock;
  };
  let mockEmit: jest.Mock;
  let mockToEmit: jest.Mock;
  let mockDisconnectSockets: jest.Mock;

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
    mockDisconnectSockets = jest.fn();
    mockServer = {
      to: jest.fn().mockReturnValue({ emit: mockToEmit }),
      in: jest.fn().mockReturnValue({ disconnectSockets: mockDisconnectSockets }),
      emit: mockEmit,
    };

    mockRedis = {
      createSubscriberClient: jest.fn().mockReturnValue(mockSubscriber),
      refreshHeartbeat: jest.fn().mockResolvedValue(undefined),
      publishUserBattleEvent: jest.fn().mockResolvedValue(undefined),
    };

    mockBattleManager = {
      isHostedLocally: jest.fn().mockReturnValue(true),
      processChoice: jest.fn().mockResolvedValue(undefined),
      forfeit: jest.fn().mockResolvedValue(undefined),
      cancelChoice: jest.fn().mockResolvedValue(undefined),
      handleDisconnect: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        BattleSocketBridgeServiceProvider,
        { provide: REDIS_SERVICE, useValue: mockRedis },
        { provide: BATTLE_MANAGER_SERVICE, useValue: mockBattleManager },
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

    it('registerSocket with existing socket → emits SESSION_REPLACED and disconnects old socket', () => {
      service.registerSocket('s1', 'u1');

      mockServer.to.mockClear();
      mockToEmit.mockClear();

      service.registerSocket('s2', 'u1');

      // Should emit SESSION_REPLACED to old socket and disconnect it
      expect(mockServer.to).toHaveBeenCalledWith('s1');
      expect(mockToEmit).toHaveBeenCalledWith('SESSION_REPLACED');
      expect(mockServer.in).toHaveBeenCalledWith('s1');
      expect(mockDisconnectSockets).toHaveBeenCalledWith(true);

      // New socket should be the active one
      expect(service.getSocketId('u1')).toBe('s2');
    });

    it('unregisterSocket with stale socketId → does not remove active mapping', () => {
      service.registerSocket('s1', 'u1');
      service.registerSocket('s2', 'u1');

      // Unregister the old socket (e.g. disconnect event fires after replacement)
      service.unregisterSocket('s1', 'u1');

      // Active socket should still be mapped
      expect(service.getSocketId('u1')).toBe('s2');
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
      expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith('battle:b1:action');
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

  // ── Battle action forwarding ─────────────────────────────────────

  describe('battle action forwarding', () => {
    it('subscribeBattle subscribes to both update and action channels', () => {
      service.subscribeBattle('b1');

      expect(mockSubscriber.subscribe).toHaveBeenCalledWith('battle:b1:update');
      expect(mockSubscriber.subscribe).toHaveBeenCalledWith('battle:b1:action');
    });

    it('move action → calls processChoice on battleManager', async () => {
      const message = { action: 'move', playerId: 'u1', choice: 'move 1' };

      mockSubscriber.emit('message', 'battle:b1:action', JSON.stringify(message));
      await Promise.resolve(); // flush microtasks

      expect(mockBattleManager.processChoice).toHaveBeenCalledWith('b1', 'u1', 'move 1');
    });

    it('forfeit action → calls forfeit on battleManager', async () => {
      const message = { action: 'forfeit', playerId: 'u1' };

      mockSubscriber.emit('message', 'battle:b1:action', JSON.stringify(message));
      await Promise.resolve();

      expect(mockBattleManager.forfeit).toHaveBeenCalledWith('b1', 'u1');
    });

    it('cancel_choice action → calls cancelChoice on battleManager', async () => {
      const message = { action: 'cancel_choice', playerId: 'u1' };

      mockSubscriber.emit('message', 'battle:b1:action', JSON.stringify(message));
      await Promise.resolve();

      expect(mockBattleManager.cancelChoice).toHaveBeenCalledWith('b1', 'u1');
    });

    it('disconnect action → calls handleDisconnect on battleManager', async () => {
      const message = { action: 'disconnect', playerId: 'u1' };

      mockSubscriber.emit('message', 'battle:b1:action', JSON.stringify(message));
      await Promise.resolve();

      expect(mockBattleManager.handleDisconnect).toHaveBeenCalledWith('b1', 'u1');
    });

    it('ignores action for battle not hosted locally', async () => {
      mockBattleManager.isHostedLocally.mockReturnValue(false);
      const message = { action: 'move', playerId: 'u1', choice: 'move 1' };

      mockSubscriber.emit('message', 'battle:b1:action', JSON.stringify(message));
      await Promise.resolve();

      expect(mockBattleManager.processChoice).not.toHaveBeenCalled();
    });

    it('action error → publishes error event back to player', async () => {
      // Use real timers for this test — fake timers block microtask flushing
      jest.useRealTimers();

      mockBattleManager.processChoice.mockRejectedValue(new Error('Battle ended'));
      service.registerSocket('s1', 'u1');
      const message = { action: 'move', playerId: 'u1', choice: 'move 1' };

      mockSubscriber.emit('message', 'battle:b1:action', JSON.stringify(message));

      // Flush the void async handler
      await new Promise((r) => setTimeout(r, 10));

      expect(mockToEmit).toHaveBeenCalledWith(
        BATTLE_EVENT,
        expect.objectContaining({
          type: 'ERROR',
          code: 'MOVE_ERROR',
          message: 'Battle ended',
          recoverable: true,
        })
      );
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
