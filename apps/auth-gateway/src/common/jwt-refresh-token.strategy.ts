import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { IJwtAuthService, JWT_AUTH_SERVICE } from './jwt-auth-service.interface';
import { AppLogger } from '@pokehub/common/logger';
import { ConfigService } from '@nestjs/config';
import { JwtTokenBody } from '@pokehub/auth/models';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh-token') {
  constructor(@Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService, private readonly logger: AppLogger,
              private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromHeader('authorization'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('tokenDetails.refreshTokenSecret'),
      jsonWebTokenOptions: {
          'expiresIn': `${configService.get<string>( 'tokenDetails.refreshTokenExpiration')}s`
      }
    });
    this.logger.setContext(JwtRefreshTokenStrategy.name);
  }

  async validate(payload: JwtTokenBody): Promise<{ access_token: string }> {
      try {
        this.logger.log(`validate: Successfully decoded Refresh Token for user ${payload.uid}`);

        // Create new Access Token from Decoded Data
        const accessToken = this.jwtService.getNewAccessTokenFromPayload(payload);
        this.logger.log( `validate: Successfully created New Access Token from Payload for user ${payload.uid}` );
    
        // Return New Access Token
        return accessToken;
      } catch (err) {
        this.logger.error(`validate: Got error while generating access token: ${JSON.stringify(err)}`);
        throw new InternalServerErrorException();
      }
  }
}