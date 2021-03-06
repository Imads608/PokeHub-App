import { IChatRoomData } from '@pokehub/room/interfaces';

export class ChatRoomData implements IChatRoomData {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
