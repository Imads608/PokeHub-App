import { IAuthTokens } from '@pokehub/auth/interfaces';
import { RefreshToken } from './refresh-token.model';

export class AuthTokens implements IAuthTokens {
  accessToken: string;
  refreshToken: RefreshToken;

  constructor(accessToken: string, refreshToken: RefreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
