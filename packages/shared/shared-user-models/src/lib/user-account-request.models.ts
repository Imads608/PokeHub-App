import { UserCore } from './user-data.model';

export interface UserCoreWithAccessToken {
  user: UserCore;
  accessToken: string;
}
