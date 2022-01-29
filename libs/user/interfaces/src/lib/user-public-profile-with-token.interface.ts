import { IRefreshToken } from '@pokehub/auth/interfaces';
import { IChatRoomData } from '@pokehub/room/interfaces';
import { IUserData } from './user-data.interface';

export interface IUserPublicProfileWithToken {
  user: IUserData;
  accessToken: string;
  joinedPublicRooms: IChatRoomData[];
}
