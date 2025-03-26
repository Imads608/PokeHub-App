import type { UserJwtData } from './jwt.model';
import type { TokenType } from '@pokehub/shared/shared-auth-models';
import type { UserCore } from '@pokehub/shared/shared-user-models';

export const JWT_AUTH_SERVICE = 'JWT_AUTH_SERVICE';

export interface IJwtAuthService {
  generateAccessAndRefreshTokens(
    user: UserCore
  ): Promise<{ accessToken: string; refreshToken: string }>;

  generateToken(user: UserCore, tokenType: TokenType): Promise<string>;

  validateToken(token: string, tokenType: TokenType): Promise<UserJwtData>;
}
