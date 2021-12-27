import { IChatRoomData } from '@pokehub/room';
import { IUserData } from './user-data.interface';

export interface IUserPublicProfile {
  user: IUserData;
  joinedPublicRooms: IChatRoomData[];
}
