import { IOAuthTokenBody } from '@pokehub/auth/interfaces';
import { RefreshToken } from '..';

export class OAuthTokenBody implements IOAuthTokenBody {
  username: string;
  email: string;
  uid: string;
  accessToken: string;
  refreshToken?: RefreshToken;

  constructor(username: string, email: string, uid: string, accessToken: string, refreshToken?: RefreshToken) {
    this.username = username;
    this.email = email;
    this.uid = uid;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
