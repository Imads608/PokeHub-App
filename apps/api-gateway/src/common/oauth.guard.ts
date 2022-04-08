/*
https://docs.nestjs.com/guards#guards
*/

import { Injectable, CanActivate, ExecutionContext, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtTokenBody, OAuthTokenBody } from '@pokehub/auth/models';
import { AppLogger } from '@pokehub/common/logger';
import { AUTH_SERVICE, IAuthService } from './auth-service.interface';
import { AuthService } from './auth.service';

@Injectable()
export class OAuthGuard implements CanActivate {
  constructor( @Inject(AUTH_SERVICE) private authService: IAuthService, private readonly logger: AppLogger ) {
    logger.setContext(OAuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get Request Object
    const request = context.switchToHttp().getRequest();

    try {
      this.logger.log( `canActivate: Authenticating user with Request Headers: ${JSON.stringify( request.headers )}` );

      if (!request.headers['authorization'] || request.headers['authorization'] === 'null' || request.headers['authorization'] === 'undefined')
        throw new UnauthorizedException('Token is not provided');

      // Decode Token to User Object
      const user: OAuthTokenBody = await this.authService.verifyOAuthToken( request.headers['authorization'] );
      this.logger.log( `canActivate: Successfully authenticated decoded token into ${JSON.stringify( user )}` );

      // Set User in Request Object to be used in the Controller
      if (user) {
        request.user = user;
        return true;
      }
    } catch (err) {
      this.logger.error(`canActivate: Got error decoding token: ${err}`);
    }

    // User is not Authenticated
    return false;
  }
}
