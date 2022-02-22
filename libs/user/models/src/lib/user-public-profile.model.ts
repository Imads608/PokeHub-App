import { UserData } from './user-data.model';
import { ChatRoom } from '@pokehub/room/database';
import { IUserPublicProfile } from '@pokehub/user/interfaces';
import { ChatRoomData } from '@pokehub/room/models';
import { UserPublicData } from './user-public-data.model';
import { UserStatusData } from '..';

export class UserPublicProfile implements IUserPublicProfile {
  user: UserPublicData;
  joinedPublicRooms: ChatRoomData[];
  status: UserStatusData;

  constructor(userData: UserPublicData, rooms: ChatRoomData[] | ChatRoom[], status: UserStatusData) {
    this.user = userData;
    this.joinedPublicRooms = [];
    this.status = status;
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
