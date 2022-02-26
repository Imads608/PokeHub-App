import { IUserData, IUserStatusData } from '@pokehub/user/interfaces';

export interface UserDetails {
  user: IUserData;
  accessToken: string;
  refreshToken: string;
  joinedPublicRooms: any[];
}

export interface UserStatusUpdate extends IUserStatusData {
  username: string;
  socketId: string;
}