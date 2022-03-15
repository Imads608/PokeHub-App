import { IChatRoomData } from '@pokehub/room/interfaces';
import { IUserPublicData, IUserStatusData } from '..';

export interface IUserPublicProfile {
  user: IUserPublicData;
  joinedPublicRooms: IChatRoomData[];
  status: IUserStatusData;
}
