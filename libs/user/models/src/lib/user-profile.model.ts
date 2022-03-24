import { UserData } from './user-data.model';
import { ChatRoomData } from '@pokehub/room/models';
import { ChatRoom } from '@pokehub/room/database';
import { IUserProfile } from '@pokehub/user/interfaces';

export class UserProfile implements IUserProfile {
    user: UserData;
    joinedPublicRooms: ChatRoomData[];

    constructor(userData: UserData, rooms: ChatRoomData[] | ChatRoom[]) {
        this.user = userData;
        this.joinedPublicRooms = [];
        if (rooms && rooms.length > 0 && this.isRoomChatRoomDataType(rooms[0])) {
          this.joinedPublicRooms = rooms as ChatRoomData[];
        } else if (rooms) {
          this.setDataFromChatRooms(rooms as ChatRoom[]);
        }
      }
    
      private isRoomChatRoomDataType(room: any): boolean {
        if (room.description) {
          return false;
        }
        return true;
      }
    
      private setDataFromChatRooms(rooms: ChatRoom[]): void {
        this.joinedPublicRooms = [];
        rooms.forEach((room) => {
          this.joinedPublicRooms.push(new ChatRoomData(room.id, room.name));
        });
      }
}