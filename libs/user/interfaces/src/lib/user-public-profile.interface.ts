import { IChatRoomData } from '@pokehub/room/interfaces';
import { IUserPublicData } from '..';

export interface IUserPublicProfile {
  user: IUserPublicData;
  joinedPublicRooms: IChatRoomData[];
}
