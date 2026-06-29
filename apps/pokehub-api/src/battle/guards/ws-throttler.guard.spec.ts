import { AuthenticatedSocket } from './ws-jwt.guard';
import { WsThrottlerGuard, WS_THROTTLE_KEY } from './ws-throttler.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerModuleOptions,
  ThrottlerStorage,
  ThrottlerRequest,
} from '@nestjs/throttler';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { BATTLE_EVENT } from '@pokehub/shared/pokemon-battle-types';
import { Socket } from 'socket.io';

describe('WsThrottlerGuard', () => {
  let guard: WsThrottlerGuard;
  let mockReflector: Reflector;
  let mockLogger: AppLogger;
  let mockStorageService: ThrottlerStorage;

  interface MockContextResult {
    context: ExecutionContext;
    client: { emit: jest.Mock } & Partial<AuthenticatedSocket>;
  }

  const createMockContext = (
    userId: string | undefined,
    eventName: string
  ): MockContextResult => {
    const mockEmit = jest.fn();
    const mockClient = {
      user: userId ? { userId, email: 'test@test.com' } : undefined,
      conn: { remoteAddress: '127.0.0.1' } as Socket['conn'],
      emit: mockEmit,
    };

    const context = {
      switchToWs: () => ({
        getClient: <T>(): T => mockClient as T,
        getPattern: () => eventName,
        getData: () => ({}),
      }),
      getHandler: () => () => ({}),
      getClass: () => class {},
      getType: () => 'ws' as const,
      getArgs: () => [],
      getArgByIndex: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
        getNext: () => () => ({}),
      }),
      switchToRpc: () => ({
        getContext: () => ({}),
        getData: () => ({}),
      }),
    } as ExecutionContext;

    return { context, client: mockClient };
  };

  const createThrottlerRequest = (
    context: ExecutionContext,
    overrides: Partial<ThrottlerRequest> = {}
  ): ThrottlerRequest => ({
    context,
    limit: 60,
    ttl: 60000,
    throttler: { name: 'default', ttl: 60000, limit: 60 },
    blockDuration: 0,
    getTracker: jest.fn().mockResolvedValue('tracker'),
    generateKey: jest
      .fn()
      .mockImplementation(
        (_ctx: ExecutionContext, tracker: string, name: string) =>
          `throttle:${name}:${tracker}`
      ),
    ...overrides,
  });

  beforeEach(() => {
    mockReflector = {
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
      getAllAndOverride: jest.fn(),
    } as Reflector;

    mockLogger = {
      setContext: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as AppLogger;

    mockStorageService = {
      increment: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    } as ThrottlerStorage;

    const options: ThrottlerModuleOptions = {
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 60,
        },
      ],
    };

    guard = new WsThrottlerGuard(
      options,
      mockStorageService,
      mockReflector,
      mockLogger
    );
  });

  afterEach(() => {
    guard.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('handleRequest', () => {
    it('should allow request when under rate limit', async () => {
      const { context } = createMockContext('user-123', 'MOVE');

      (mockReflector.get as jest.Mock).mockReturnValue({ limit: 2, ttl: 1000 });
      (mockStorageService.increment as jest.Mock).mockResolvedValue({
        totalHits: 1,
        timeToExpire: 1000,
        isBlocked: false,
        timeToBlockExpire: 0,
      });

      const requestProps = createThrottlerRequest(context);
      const result = await guard.handleRequest(requestProps);

      expect(result).toBe(true);
      expect(mockStorageService.increment).toHaveBeenCalledWith(
        expect.stringContaining('MOVE'),
        1000,
        2,
        1000,
        'default'
      );
    });

    it('should block request when rate limit exceeded', async () => {
      const { context, client } = createMockContext('user-123', 'MOVE');

      (mockReflector.get as jest.Mock).mockReturnValue({ limit: 2, ttl: 1000 });
      (mockStorageService.increment as jest.Mock).mockResolvedValue({
        totalHits: 3,
        timeToExpire: 500,
        isBlocked: true,
        timeToBlockExpire: 500,
      });

      const requestProps = createThrottlerRequest(context);
      const result = await guard.handleRequest(requestProps);

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded')
      );
      expect(client.emit).toHaveBeenCalledWith(
        BATTLE_EVENT,
        expect.objectContaining({
          type: 'ERROR',
          code: 'RATE_LIMITED',
        })
      );
    });

    it('should use user ID as tracker when authenticated', async () => {
      const { context } = createMockContext('user-456', 'JOIN_QUEUE');

      (mockReflector.get as jest.Mock).mockReturnValue(undefined);
      (mockStorageService.increment as jest.Mock).mockResolvedValue({
        totalHits: 1,
        timeToExpire: 60000,
        isBlocked: false,
        timeToBlockExpire: 0,
      });

      const generateKey = jest
        .fn()
        .mockReturnValue('throttle:default:user-456');
      const requestProps = createThrottlerRequest(context, { generateKey });

      await guard.handleRequest(requestProps);

      expect(generateKey).toHaveBeenCalledWith(context, 'user-456', 'default');
    });

    it('should use socket address as fallback when not authenticated', async () => {
      const { context } = createMockContext(undefined, 'JOIN_QUEUE');

      (mockReflector.get as jest.Mock).mockReturnValue(undefined);
      (mockStorageService.increment as jest.Mock).mockResolvedValue({
        totalHits: 1,
        timeToExpire: 60000,
        isBlocked: false,
        timeToBlockExpire: 0,
      });

      const generateKey = jest
        .fn()
        .mockReturnValue('throttle:default:127.0.0.1');
      const requestProps = createThrottlerRequest(context, { generateKey });

      await guard.handleRequest(requestProps);

      expect(generateKey).toHaveBeenCalledWith(context, '127.0.0.1', 'default');
    });

    it('should include event name in the key for per-event rate limiting', async () => {
      const { context } = createMockContext('user-123', 'FORFEIT');

      (mockReflector.get as jest.Mock).mockReturnValue({ limit: 1, ttl: 5000 });
      (mockStorageService.increment as jest.Mock).mockResolvedValue({
        totalHits: 1,
        timeToExpire: 5000,
        isBlocked: false,
        timeToBlockExpire: 0,
      });

      const requestProps = createThrottlerRequest(context, {
        generateKey: jest.fn().mockReturnValue('throttle:default:user-123'),
      });

      await guard.handleRequest(requestProps);

      expect(mockStorageService.increment).toHaveBeenCalledWith(
        'throttle:default:user-123:FORFEIT',
        5000,
        1,
        5000,
        'default'
      );
    });

    it('should use decorator config over default module config', async () => {
      const { context } = createMockContext('user-123', 'MOVE');

      (mockReflector.get as jest.Mock).mockReturnValue({ limit: 2, ttl: 1000 });
      (mockStorageService.increment as jest.Mock).mockResolvedValue({
        totalHits: 1,
        timeToExpire: 1000,
        isBlocked: false,
        timeToBlockExpire: 0,
      });

      const requestProps = createThrottlerRequest(context, {
        limit: 60,
        ttl: 60000,
      });

      await guard.handleRequest(requestProps);

      expect(mockStorageService.increment).toHaveBeenCalledWith(
        expect.any(String),
        1000,
        2,
        1000,
        'default'
      );
    });

    it('should use default module config when no decorator present', async () => {
      const { context } = createMockContext('user-123', 'MOVE');

      (mockReflector.get as jest.Mock).mockReturnValue(undefined);
      (mockStorageService.increment as jest.Mock).mockResolvedValue({
        totalHits: 1,
        timeToExpire: 60000,
        isBlocked: false,
        timeToBlockExpire: 0,
      });

      const requestProps = createThrottlerRequest(context);

      await guard.handleRequest(requestProps);

      expect(mockStorageService.increment).toHaveBeenCalledWith(
        expect.any(String),
        60000,
        60,
        0,
        'default'
      );
    });
  });

  describe('shouldSkip', () => {
    it('should not skip for WebSocket context', async () => {
      const { context } = createMockContext('user-123', 'MOVE');

      // Access protected method via prototype
      const shouldSkipFn = Object.getPrototypeOf(guard).shouldSkip.bind(guard);
      const result = await shouldSkipFn(context);

      expect(result).toBe(false);
    });
  });

  describe('WS_THROTTLE_KEY', () => {
    it('should be defined for metadata storage', () => {
      expect(WS_THROTTLE_KEY).toBe('ws_throttle');
    });
  });
});
