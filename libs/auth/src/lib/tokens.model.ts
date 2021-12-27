import { IAuthTokens } from './interfaces/tokens.interface';

export class AuthTokens implements IAuthTokens {
  accessToken: string;
  refreshToken: string;

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
