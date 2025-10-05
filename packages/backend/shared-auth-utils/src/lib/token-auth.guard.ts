import { AuthLoadRequest } from './auth-request.model';
import { JwtAppConfiguration } from './jwt-app-config.model';
import { IJwtAuthService, JWT_AUTH_SERVICE } from './jwt-service.interface';
import { UserJwtData } from './jwt.model';
import { TokenAuth } from './token-auth.decorator';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AppLogger } from '@pokehub/backend/shared-logger';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService<JwtAppConfiguration, true>,
    @Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService,
    private readonly reflector: Reflector
  ) {
    this.logger.setContext(TokenAuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log(
      `${this.canActivate.name}: Checking if request is authorized`
    );
    const tokenType = this.reflector.get(TokenAuth, context.getHandler());
    const request = context.switchToHttp().getRequest<AuthLoadRequest>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!authHeader || !token || token === '') {
      this.logger.error(
        `${this.canActivate.name}: No token provided in request. Returning`
      );
      return false;
    }

    let data: UserJwtData;

    this.logger.log(`${this.canActivate.name}: Verifying token: ${token}`);

    try {
      data = await this.jwtService.validateToken(token, tokenType);
    } catch (err) {
      this.logger.error(
        `${this.canActivate.name}: Error verifying token: ${err}`
      );
      return false;
    }

    request.user = data;
    return true;
  }
}
