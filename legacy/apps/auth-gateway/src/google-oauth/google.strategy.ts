import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { config } from 'dotenv';

import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { IJwtAuthService, JWT_AUTH_SERVICE } from '../common/jwt-auth-service.interface';
import { AppLogger } from '@pokehub/common/logger';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserRequest, UserData, UserDataWithToken } from '@pokehub/user/models';
import { TypeAccount } from '@pokehub/user/interfaces';
import { firstValueFrom } from 'rxjs';
import { JwtTokenBody } from '@pokehub/auth/models';
import { UserTCPGatewayEndpoints } from '@pokehub/user/endpoints';

config();

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {

  constructor(@Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService, private readonly logger: AppLogger,
              private readonly configService: ConfigService, @Inject('UserTCPGateway') private readonly clientProxy: ClientProxy) {
    super({
      clientID: configService.get<string>('googleClientCreds.id'),
      clientSecret: configService.get<string>('googleClientCreds.secret'),
      callbackURL: `${configService.get<string>('protocol')}://${configService.get<string>('callbacks.host')}:${configService.get<string>('callbacks.port')}${configService.get<string>('googleClientCreds.callback')}`,//'http://localhost:3000/google/redirect',
      scope: ['email', 'profile'],
    });
  }

  async validate (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile
    /*
    const tokens = await this.jwtService.generateAccessAndRefreshTokens()
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken
    }*/
    const user = await this.googleOAuthLogin(profile);
    done(null, user);
  }

  private async googleOAuthLogin(payload: any): Promise<UserDataWithToken> {
    try {
        // Create or Retrieve User Data
        this.logger.log( `googleOAuthLogin: Fetching/Creating User Data from User Microservice: ${JSON.stringify(payload)}` );
        const createReq = new CreateUserRequest( payload.emails[0].value, '', TypeAccount.GOOGLE.toString(), 
                                                `${payload.email} + ${this.configService.get<string>( 'ACCESS_TOKEN_SECRET' )}`, 
                                                payload.name.givenName, payload.name.familyName, payload.emails[0].verified );
        const userData = await firstValueFrom( this.clientProxy.send<UserData>( { cmd: UserTCPGatewayEndpoints.GOOGLE_OAUTH_LOGIN }, createReq ) );
        if (!userData)
            throw new InternalServerErrorException();

        this.logger.log( `googleOAuthLogin: Successfully fetched/created User Data from User Microservice` );

        // Create Access and Refresh Tokens
        const tokens = await this.jwtService.generateAccessAndRefreshTokens( new JwtTokenBody(userData.username, userData.email, userData.uid) );

        // Send User Data back
        this.logger.log( `googleOAuthService: Successfully authenticated User through Google OAuth. Sending User Details back...` );
        return new UserDataWithToken( userData, tokens.accessToken, tokens.refreshToken );
    } catch (err) {
        this.logger.error( `googleOAuthLogin: Got error while authenticating user through Google OAuth: ${err.message}`, err.stack);
        throw new InternalServerErrorException();
    }
}
}