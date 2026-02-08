import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import {
  JWT_AUTH_SERVICE,
  type IJwtAuthService,
} from '@pokehub/backend/shared-auth-utils';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  user: {
    userId: string;
    email: string;
  };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly logger: AppLogger,
    @Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService
  ) {
    this.logger.setContext(WsJwtGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    return this.validateClient(client);
  }

  /**
   * Validate a socket client and attach user info.
   * Can be called directly for handleConnection where guards don't work.
   */
  async validateClient(client: Socket): Promise<boolean> {
    const token = this.extractToken(client);

    if (!token) {
      this.logger.warn('No token provided in WebSocket connection');
      return false;
    }

    try {
      const payload = await this.jwtService.validateToken(
        token,
        'ACCESS_TOKEN'
      );
      (client as AuthenticatedSocket).user = {
        userId: payload.id,
        email: payload.email,
      };
      return true;
    } catch (error) {
      this.logger.warn(`Invalid WebSocket token: ${error}`);
      return false;
    }
  }

  /**
   * Extract JWT token from the socket handshake.
   *
   * Token sources (in order of preference):
   * 1. auth object (recommended) - sent in WebSocket handshake body, not visible in URLs
   * 2. Authorization header - standard Bearer token, also secure
   * 3. query params (deprecated) - INSECURE, can leak in logs/history/referrer headers
   *
   * Clients should use: `io(url, { auth: { token: 'xxx' } })`
   */
  private extractToken(client: Socket): string | undefined {
    // 1. Preferred: Token from auth object (Socket.io recommended approach)
    // Sent in WebSocket handshake body, not visible in URLs or logs
    const authToken = client.handshake.auth?.['token'];
    if (typeof authToken === 'string') {
      return authToken;
    }

    // 2. Alternative: Authorization header (also secure)
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    // 3. Deprecated: Query params (INSECURE - logs warning)
    // Tokens in URLs can leak via server logs, browser history, and referrer headers
    const queryToken = client.handshake.query['token'];
    if (typeof queryToken === 'string') {
      this.logger.warn(
        'Token passed via query param is insecure and deprecated. ' +
          'Use auth object instead: io(url, { auth: { token } })'
      );
      return queryToken;
    }

    return undefined;
  }
}
