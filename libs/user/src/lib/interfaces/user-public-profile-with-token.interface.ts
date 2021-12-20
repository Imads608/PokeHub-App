import { IChatRoomData } from "@pokehub/room";
import { IUserData } from "./user-data.interface";

export interface IUserPublicProfileWithToken {
    user: IUserData
    accessToken: string;
    refreshToken: string;
    joinedPublicRooms: IChatRoomData[];
}