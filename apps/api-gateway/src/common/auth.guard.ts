/*
https://docs.nestjs.com/guards#guards
*/

import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { JwtTokenBody } from '@pokehub/auth';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private logger = new Logger(AuthGuard.name);

  constructor(private authService: AuthService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      this.logger.log('Request Headers: ' + JSON.stringify(request.headers));
      const user: JwtTokenBody = await this.authService.decodeToken(request.headers["authorization"]);
      this.logger.log('Got user in AuthGuard: ' + JSON.stringify(user));
      if (user) {
        request.user = user;
        return true;
      }
    } catch (err) {
      this.logger.error(`Got error decoding token: ${err}`);
    }

    return false;
  }
}
