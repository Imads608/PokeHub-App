import { ChatRoom } from '@pokehub/chat/database';
import { IUserPublicProfile } from '@pokehub/user/interfaces';
import { ChatRoomData } from '@pokehub/chat/models';
import { UserPublicData } from './user-public-data.model';

export class UserPublicProfile implements IUserPublicProfile {
  user: UserPublicData;
  joinedPublicRooms: ChatRoomData[];

  constructor(userData: UserPublicData, rooms: ChatRoomData[] | ChatRoom[]) {
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
