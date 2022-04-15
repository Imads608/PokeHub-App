import { IChatRoomData } from '@pokehub/chat/interfaces';
import { IUserPublicData } from '..';

export interface IUserPublicProfile {
  user: IUserPublicData;
  joinedPublicRooms: IChatRoomData[];
}
