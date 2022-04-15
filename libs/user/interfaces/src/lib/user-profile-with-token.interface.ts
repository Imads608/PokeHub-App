import { IChatRoomData } from '@pokehub/chat/interfaces';
import { IUserData } from './user-data.interface';

export interface IUserProfileWithToken {
  user: IUserData;
  accessToken: string;
  joinedPublicRooms: IChatRoomData[];
}
