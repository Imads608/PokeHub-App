import { AuthenticatedSocket } from './ws-jwt.guard';
import {
  Injectable,
  ExecutionContext,
  SetMetadata,
  OnModuleDestroy,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
  ThrottlerRequest,
} from '@nestjs/throttler';
import { AppLogger } from '@pokehub/backend/shared-logger';
import {
  BATTLE_EVENT,
  ServerBattleEvent,
} from '@pokehub/shared/pokemon-battle-types';

/**
 * Metadata key for per-handler throttle configuration
 */
export const WS_THROTTLE_KEY = 'ws_throttle';

/**
 * Decorator to apply custom rate limiting to a WebSocket event handler.
 * Overrides the default throttler configuration for this specific handler.
 *
 * @param limit - Maximum number of requests allowed in the time window
 * @param ttl - Time window in milliseconds
 *
 * @example
 * ```typescript
 * @WsThrottle(1, 1000) // 1 request per second
 * @SubscribeMessage('MOVE')
 * async handleMove(...) { }
 * ```
 */
export const WsThrottle = (limit: number, ttl: number) =>
  SetMetadata(WS_THROTTLE_KEY, { limit, ttl });

/**
 * WebSocket-aware rate limiting guard extending NestJS ThrottlerGuard.
 *
 * Key differences from HTTP throttling:
 * 1. Uses authenticated user ID as tracker instead of IP address
 * 2. Includes event name in the key for per-event rate limiting
 * 3. Emits structured error events to the WebSocket client
 *
 * Usage notes from NestJS docs:
 * - Cannot be registered with APP_GUARD or app.useGlobalGuards()
 * - Must be applied per-handler with @UseGuards(WsThrottlerGuard)
 * - When limit is reached, emits an error event to the client
 *
 * @see https://docs.nestjs.com/security/rate-limiting#websockets
 */
@Injectable()
export class WsThrottlerGuard
  extends ThrottlerGuard
  implements OnModuleDestroy
{
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly logger: AppLogger
  ) {
    super(options, storageService, reflector);
    this.logger.setContext(WsThrottlerGuard.name);
  }

  onModuleDestroy(): void {
    // Cleanup handled by parent class and storage service
  }

  /**
   * Override handleRequest for WebSocket-specific handling.
   * Uses user ID + event name as the tracking key instead of IP address.
   */
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration, generateKey } =
      requestProps;

    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const eventName = context.switchToWs().getPattern() as string;

    // Check for per-handler override via @WsThrottle decorator
    const handlerConfig = this.reflector.get<{ limit: number; ttl: number }>(
      WS_THROTTLE_KEY,
      context.getHandler()
    );

    const effectiveLimit = handlerConfig?.limit ?? limit;
    const effectiveTtl = handlerConfig?.ttl ?? ttl;
    const effectiveBlockDuration = handlerConfig?.ttl ?? blockDuration;

    // Use user ID as tracker (requires authentication via WsJwtGuard)
    // Falls back to socket remote address if user is not authenticated
    const userId = client.user?.userId;
    const tracker = userId ?? client.conn?.remoteAddress ?? 'unknown';

    // Include event name in the key for per-event rate limiting
    const throttlerName = throttler.name ?? 'default';
    const key = `${generateKey(context, tracker, throttlerName)}:${eventName}`;

    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        effectiveTtl,
        effectiveLimit,
        effectiveBlockDuration,
        throttlerName
      );

    if (isBlocked) {
      const retryAfterSeconds = Math.ceil(
        (timeToBlockExpire ?? timeToExpire) / 1000
      );

      this.logger.warn(
        `Rate limit exceeded for user ${tracker} on event ${eventName}. ` +
          `Hits: ${totalHits}/${effectiveLimit}. Retry after: ${retryAfterSeconds}s`
      );

      // Emit error to client instead of throwing (WebSocket best practice)
      client.emit(BATTLE_EVENT, {
        type: 'ERROR',
        code: 'RATE_LIMITED',
        message: `Too many requests. Please wait ${retryAfterSeconds} second${
          retryAfterSeconds !== 1 ? 's' : ''
        } before trying again.`,
        recoverable: true,
      } satisfies ServerBattleEvent);

      return false;
    }

    return true;
  }

  /**
   * Override to handle WebSocket context properly.
   * The default implementation tries to get HTTP request/response which fails for WS.
   */
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    // Check if this is a WebSocket context
    const type = context.getType();
    if (type !== 'ws') {
      // Let parent handle non-WS contexts
      return super.shouldSkip(context);
    }

    // For WebSocket, we don't skip by default
    // Could add custom skip logic here if needed
    return false;
  }
}
