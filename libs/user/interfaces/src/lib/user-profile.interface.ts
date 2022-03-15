import { IUserData } from './user-data.interface';
import { IChatRoomData, IChatRoom } from '@pokehub/room/interfaces';
import { IUserStatusData } from '..';

export interface IUserProfile {
    user: IUserData;
    joinedPublicRooms: IChatRoomData[];
    status: IUserStatusData;
}