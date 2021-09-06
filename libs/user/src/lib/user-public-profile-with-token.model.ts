import { ChatRoom, ChatRoomData } from "@pokehub/room";
import { UserDataWithToken } from "./user-data-token.model";
import { UserData } from "./user-data.model";

export class UserPublicProfileWithToken extends UserDataWithToken {
    joinedPublicRooms: ChatRoomData[];

    constructor(userData: UserData, accessToken: string, refreshToken: string, rooms: ChatRoomData[] | ChatRoom[]) {
        super(userData, accessToken, refreshToken);
        if (rooms.length > 0 && this.isRoomChatRoomDataType(rooms[0])) {
            this.setDataFromChatRooms(rooms as ChatRoom[]);
        } else {
            this.joinedPublicRooms = rooms;
        }
    }

    private isRoomChatRoomDataType(room: any): Boolean {
        if (room.description != undefined)
            return false;
        return true;
    }

    private setDataFromChatRooms(rooms: ChatRoom[]): void {
        this.joinedPublicRooms = [];
        rooms.forEach(room => {
            this.joinedPublicRooms.push(new ChatRoomData(room.id, room.name));
        })
    }
}