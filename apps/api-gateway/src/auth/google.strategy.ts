import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AppLogger } from '@pokehub/logger';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger
  ) {
    super({
      clientID: configService.get<string>('googleClientCreds.id'),
      clientSecret: configService.get<string>('googleClientCreds.secret'),
      callbackURL: 'http://localhost:3015/auth/redirect',
      scope: ['email', 'profile'],
    });
    logger.setContext(GoogleStrategy.name);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    this.logger.log('Got user data to send from google');
    const { emails, name, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
    };
    done(null, user);
  }
}
