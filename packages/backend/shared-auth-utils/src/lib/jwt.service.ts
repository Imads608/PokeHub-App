import type { JwtAppConfiguration } from './jwt-app-config.model';
import {
  JWT_AUTH_SERVICE,
  type IJwtAuthService,
} from './jwt-service.interface';
import type { UserJwtData } from './jwt.model';
import type { Provider } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type JsonWebTokenError,
  JwtService,
  type TokenExpiredError,
} from '@nestjs/jwt';
import { ServiceError } from '@pokehub/backend/shared-exceptions';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { TokenType } from '@pokehub/shared/shared-auth-models';

@Injectable()
export class JwtAuthService implements IJwtAuthService {
  constructor(
    private readonly logger: AppLogger,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<JwtAppConfiguration, true>
  ) {
    this.logger.setContext(JwtAuthService.name);
  }

  async generateAccessAndRefreshTokens(
    user: UserJwtData
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.log(
      `${this.generateAccessAndRefreshTokens.name}: Creating Access And Refresh Tokens for User`
    );

    const secretsConfig = this.configService.get('secrets', { infer: true });

    try {
      const accessToken = this.jwtService.sign(user, {
        secret: secretsConfig.ACCESS_TOKEN.value,
        expiresIn: `${secretsConfig.ACCESS_TOKEN.expiryMinutes * 60}s`,
      });
      const refreshToken = this.jwtService.sign(user, {
        secret: secretsConfig.REFRESH_TOKEN.value,
        expiresIn: `${secretsConfig.REFRESH_TOKEN.expiryMinutes * 60}s`,
      });

      this.logger.log(
        `${this.generateAccessAndRefreshTokens.name}: Access And Refresh Tokens Created Successfully`
      );
      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(
        `${this.generateAccessAndRefreshTokens.name}: Error Creating Access And Refresh Tokens`,
        error
      );
      throw new ServiceError(
        'ServiceError',
        'Error Creating Access And Refresh Tokens'
      );
    }
  }

  async generateToken(
    user: UserJwtData,
    tokenType: TokenType
  ): Promise<string> {
    this.logger.log(
      `${this.generateToken.name}: Creating Token of type ${tokenType} for User`
    );

    const payload: UserJwtData = {
      id: user.id,
      email: user.email,
      accountType: user.accountType,
      accountRole: user.accountRole,
    };

    const secretsConfig = this.configService.get('secrets', { infer: true });

    try {
      const token = this.jwtService.sign(payload, {
        secret: secretsConfig[tokenType].value,
        expiresIn: `${secretsConfig[tokenType].expiryMinutes * 60}s`,
      });
      this.logger.log(`${this.generateToken.name}: Token Created Successfully`);
      return token;
    } catch (err) {
      this.logger.error(
        `${this.generateToken.name}: Error Creating Token of Type ${tokenType}`,
        err
      );
      throw new ServiceError(
        'ServiceError',
        `Error Creating Token of Type ${tokenType}`
      );
    }
  }

  async validateToken(
    token: string,
    tokenType: TokenType
  ): Promise<UserJwtData> {
    this.logger.log(
      `${this.validateToken.name}: Validating Token of type ${tokenType}`
    );

    const secretsConfig = this.configService.get('secrets', { infer: true });

    this.logger.log(
      `${this.validateToken.name}: Secrets Config: ${JSON.stringify(
        secretsConfig
      )}`
    );

    try {
      const payload = this.jwtService.verify<UserJwtData>(token, {
        secret: secretsConfig[tokenType].value,
      });
      this.logger.log(
        `${this.validateToken.name}: Token Validated Successfully`
      );
      return payload;
    } catch (err) {
      this.logger.error(
        `${this.validateToken.name}: Error Validating Token of Type ${tokenType}`,
        err
      );

      if ((err as TokenExpiredError).name === 'TokenExpiredError') {
        throw new ServiceError(
          'Unauthorized',
          `Token of type ${tokenType} has expired`
        );
      } else if ((err as JsonWebTokenError).name === 'JsonWebTokenError') {
        throw new ServiceError(
          'BadRequest',
          `Token of type ${tokenType} is invalid`
        );
      }
      throw new ServiceError(
        'ServiceError',
        `Error Validating Token of Type ${tokenType}`
      );
    }
  }
}

export const JwtServiceProvider: Provider = {
  provide: JWT_AUTH_SERVICE,
  useClass: JwtAuthService,
};
