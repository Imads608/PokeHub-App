import { Participant, RoomType } from '..';
import { IChatRoomData } from './interfaces/chatroom-data.interface';

export class ChatRoomData implements IChatRoomData {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
