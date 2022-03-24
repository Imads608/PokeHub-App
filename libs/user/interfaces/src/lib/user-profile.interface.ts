import { IUserData } from './user-data.interface';
import { IChatRoomData, IChatRoom } from '@pokehub/room/interfaces';

export interface IUserProfile {
    user: IUserData;
    joinedPublicRooms: IChatRoomData[];
}