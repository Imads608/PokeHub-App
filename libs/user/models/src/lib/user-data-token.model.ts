import { IUserDataWithToken } from '@pokehub/user/interfaces';
import { RefreshToken } from '@pokehub/auth/models';
import { UserData } from './user-data.model';

export class UserDataWithToken implements IUserDataWithToken {
  user: UserData;
  accessToken: string;
  refreshToken?: RefreshToken;

  constructor(userData: UserData, accessToken: string, refreshToken?: RefreshToken) {
    this.user = userData;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
