import { IRefreshToken } from '@pokehub/auth/interfaces';
import { IChatRoomData } from '@pokehub/room/interfaces';
import { IUserStatusData } from '..';
import { IUserData } from './user-data.interface';

export interface IUserProfileWithToken {
  user: IUserData;
  accessToken: string;
  joinedPublicRooms: IChatRoomData[];
  status: IUserStatusData;
}
