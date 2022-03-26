import { ChatRoom } from '@pokehub/room/database';
import { ChatRoomData } from '@pokehub/room/models';
import { IUserProfileWithToken } from '@pokehub/user/interfaces';
import { UserDataWithToken } from './user-data-token.model';
import { UserData } from './user-data.model';

export class UserProfileWithToken extends UserDataWithToken implements IUserProfileWithToken {
  joinedPublicRooms: ChatRoomData[];

  constructor(
    userData: UserData,
    accessToken: string,
    rooms: ChatRoomData[] | ChatRoom[]
  ) {
    super(userData, accessToken);
    this.joinedPublicRooms = [];
    
    if (rooms && rooms.length > 0 && this.isRoomChatRoomDataType(rooms[0])) {
      this.setDataFromChatRooms(rooms as ChatRoom[]);
    } else if (rooms) {
      this.joinedPublicRooms = rooms as ChatRoomData[];
    }
  }

  private isRoomChatRoomDataType(room: any): boolean {
    if (room.description != undefined) return false;
    return true;
  }

  private setDataFromChatRooms(rooms: ChatRoom[]): void {
    this.joinedPublicRooms = [];
    rooms.forEach((room) => {
      this.joinedPublicRooms?.push(new ChatRoomData(room.id, room.name));
    });
  }
}
