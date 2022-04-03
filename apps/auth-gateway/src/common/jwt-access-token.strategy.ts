import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { IJwtAuthService, JWT_AUTH_SERVICE } from './jwt-auth-service.interface';
import { AppLogger } from '@pokehub/common/logger';
import { ConfigService } from '@nestjs/config';
import { JwtTokenBody } from '@pokehub/auth/models';

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access-token') {
  constructor(@Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService, private readonly logger: AppLogger,
              private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromHeader('authorization'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('tokenDetails.accessTokenSecret'),
      jsonWebTokenOptions: {
          'expiresIn': `${configService.get<string>( 'tokenDetails.accessTokenExpiration')}s`
      }
    });
    this.logger.setContext(JwtAccessTokenStrategy.name);
  }

  async validate(payload: JwtTokenBody) {
    return payload;
  }
}