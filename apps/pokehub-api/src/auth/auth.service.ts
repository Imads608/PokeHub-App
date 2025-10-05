import type { PokeHubApiConfiguration } from '../config/configuration.model';
import { IUsersService, USERS_SERVICE } from '../users/users.service.interface';
import { AUTH_SERVICE, type IAuthService } from './auth.service.interface';
import { Inject, Injectable, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IJwtAuthService,
  UserJwtData,
} from '@pokehub/backend/shared-auth-utils';
import { JWT_AUTH_SERVICE } from '@pokehub/backend/shared-auth-utils';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { AccessToken } from '@pokehub/shared/shared-auth-models';
import type { OAuthLoginResponse } from '@pokehub/shared/shared-user-models';

@Injectable()
class AuthService implements IAuthService {
  constructor(
    private readonly logger: AppLogger,
    @Inject(USERS_SERVICE) private readonly usersService: IUsersService,
    @Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService,
    private readonly configService: ConfigService<PokeHubApiConfiguration, true>
  ) {
    logger.setContext(AuthService.name);
  }

  async createOrLoginUser(email: string): Promise<OAuthLoginResponse> {
    this.logger.log(`User logged in ${email}`);
    let user = await this.usersService.getUserCore(email, 'email');
    this.logger.log(`User found: ${JSON.stringify(user)}`);
    if (!user) {
      user = await this.usersService.createUser(email, 'GOOGLE');
    }
    const tokens = await this.jwtService.generateAccessAndRefreshTokens(user);
    const secretsConfig = this.configService.get('secrets', { infer: true });
    return {
      user,
      tokens: {
        refreshToken: tokens.refreshToken,
        accessToken: {
          value: tokens.accessToken,
          expirySeconds: secretsConfig.ACCESS_TOKEN.expiryMinutes * 60,
        },
      },
    };
  }

  async refreshAccessToken(user: UserJwtData): Promise<AccessToken> {
    this.logger.log(`User ${user.email} requested access token`);
    const token = await this.jwtService.generateToken(user, 'ACCESS_TOKEN');
    const secretsConfig = this.configService.get('secrets', { infer: true });
    return {
      value: token,
      expirySeconds: secretsConfig.ACCESS_TOKEN.expiryMinutes * 60,
    };
  }
}

export const AuthServiceProvider: Provider = {
  provide: AUTH_SERVICE,
  useClass: AuthService,
};
