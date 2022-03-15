import { IUserDataWithToken } from '@pokehub/user/interfaces';
import { RefreshToken } from '@pokehub/auth/models';
import { UserData } from './user-data.model';
import { UserStatusData } from '..';

export class UserDataWithToken implements IUserDataWithToken {
  user: UserData;
  accessToken: string;
  refreshToken?: RefreshToken;
  status: UserStatusData;

  constructor(userData: UserData, accessToken: string, status: UserStatusData, refreshToken?: RefreshToken) {
    this.user = userData;
    this.accessToken = accessToken;
    this.status = status;
    this.refreshToken = refreshToken;
  }
}
