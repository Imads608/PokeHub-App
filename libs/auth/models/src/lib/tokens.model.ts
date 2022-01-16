import { IAuthTokens } from '@pokehub/auth/interfaces';

export class AuthTokens implements IAuthTokens {
  accessToken: string;
  refreshToken: string;

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
