import type { PokeHubApiConfiguration } from '../config/configuration.model';
import { AUTH_SERVICE, type IAuthService } from './auth.service.interface';
import { Inject, Injectable, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IUsersDBService } from '@pokehub/backend/pokehub-users-db';
import { USERS_DB_SERVICE } from '@pokehub/backend/pokehub-users-db';
import type { IJwtAuthService } from '@pokehub/backend/shared-auth-utils';
import { JWT_AUTH_SERVICE } from '@pokehub/backend/shared-auth-utils';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { OAuthLoginResponse } from '@pokehub/shared/shared-user-models';

@Injectable()
class AuthService implements IAuthService {
  constructor(
    private readonly logger: AppLogger,
    @Inject(USERS_DB_SERVICE) private readonly usersDBService: IUsersDBService,
    @Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService,
    private readonly configService: ConfigService<PokeHubApiConfiguration, true>
  ) {
    logger.setContext(AuthService.name);
  }

  async createOrLoginUser(email: string): Promise<OAuthLoginResponse> {
    this.logger.log(`User logged in ${email}`);
    const user = await this.usersDBService.createUser(email, 'GOOGLE');
    const tokens = await this.jwtService.generateAccessAndRefreshTokens(user);
    const secretsConfig = this.configService.get('secrets', { infer: true });
    return {
      user,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: {
          value: tokens.refreshToken,
          expirySeconds: secretsConfig.REFRESH_TOKEN.expiryMinutes * 60,
        },
      },
    };
  }
}

export const AuthServiceProvider: Provider = {
  provide: AUTH_SERVICE,
  useClass: AuthService,
};
