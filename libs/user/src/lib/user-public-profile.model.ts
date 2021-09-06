import { UserData } from "./user-data.model";
import { ChatRoom, ChatRoomData } from '@pokehub/room';

export class UserPublicProfile {
    user: UserData;
    joinedPublicRooms: ChatRoomData[];

    constructor(userData: UserData, rooms: ChatRoomData[] | ChatRoom[]) {
        this.user = userData;
        if (rooms.length > 0 && this.isRoomChatRoomDataType(rooms[0])) {
            this.joinedPublicRooms = rooms;
        } else {
            this.setDataFromChatRooms(rooms as ChatRoom[]);

        }
    }

    private isRoomChatRoomDataType(room: any): Boolean {
        if (room.description) {
            return false;
        } 
        return true;
    }

    private setDataFromChatRooms(rooms: ChatRoom[]): void {
        this.joinedPublicRooms = [];
        rooms.forEach(room => {
            this.joinedPublicRooms.push(new ChatRoomData(room.id, room.name));
        })
    }
}