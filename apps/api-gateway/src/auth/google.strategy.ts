import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    private logger = new Logger(GoogleStrategy.name);

    constructor(private readonly configService: ConfigService) {
        super({
            clientID: '490564752077-hlbp1k70hlsqo1quibgmcpetanscrpqu.apps.googleusercontent.com',
            clientSecret: 'y3rJ2dMtlx7g3m-BD03LmVjZ',
            callbackURL: 'http://localhost:3015/auth/redirect',
            scope: ['email', 'profile']
        });
        this.logger.log(`Client ID: ${configService.get('GOOGLE_CLIENT_ID')}`);
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        this.logger.log('Got user data to send from google');
        const { emails, name, photos } = profile;
        const user = {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            picture: photos[0].value
        };
        done(null, user);
    }
}