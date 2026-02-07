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

  private extractToken(client: Socket): string | undefined {
    // Try to get token from auth header in handshake
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    // Try to get token from query params
    const queryToken = client.handshake.query['token'];
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    // Try to get token from auth object
    const authToken = client.handshake.auth?.['token'];
    if (typeof authToken === 'string') {
      return authToken;
    }

    return undefined;
  }
}
