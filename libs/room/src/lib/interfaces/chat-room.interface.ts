import { RoomType } from "@pokehub/room";

export interface IChatRoom {
    id: string;
    name: string;
    description: string;
    roomType: RoomType;
}