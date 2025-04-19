import type { PokeHubApiConfiguration } from '../config/configuration.model';
import type { OAuthRequest } from './oauth-request.model';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { LoginTicket, OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleOAuthGuard implements CanActivate {
  private oauthClient: OAuth2Client;
  private clientId: string;

  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService<PokeHubApiConfiguration, true>
  ) {
    this.logger.setContext(GoogleOAuthGuard.name);
    const googleOAuth = this.configService.get('googleOAuth', { infer: true });
    this.clientId = googleOAuth.clientId;
    this.oauthClient = new OAuth2Client(googleOAuth.clientId);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log(
      `${this.canActivate.name}: Checking if request is authorized`
    );
    const request = context.switchToHttp().getRequest<OAuthRequest>();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      this.logger.error(
        `${this.canActivate.name}: No token provided in request. Returning`
      );
      return false;
    }
    const token = authHeader.split(' ')[1];
    let data: LoginTicket;

    try {
      data = await this.oauthClient.verifyIdToken({
        idToken: token,
        audience: this.clientId,
      });
    } catch (err) {
      this.logger.error(
        `${this.canActivate.name}: Error verifying token: ${err}`
      );
      return false;
    }
    const email = data.getPayload()?.email;

    if (!email) {
      this.logger.error(
        `${this.canActivate.name}: No email found in token. Returning`
      );
      return false;
    }

    request.user = { email, accountType: 'GOOGLE' };
    return true;
  }
}
