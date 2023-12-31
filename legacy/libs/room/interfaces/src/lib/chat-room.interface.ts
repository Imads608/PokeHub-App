import { RoomType } from './room-type.enum';

export interface IChatRoom {
  id: string;
  name: string;
  description: string;
  roomType: RoomType;
}
