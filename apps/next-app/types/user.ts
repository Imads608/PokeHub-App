import { IUserData } from '@pokehub/user/interfaces';

export interface UserDetails {
  user: IUserData;
  accessToken: string;
  refreshToken: string;
  joinedPublicRooms: any[];
}
