import { UserSocketEvents } from '..';
import { IUserEventMessage } from './interfaces/user-event-message.interface';
import { UserSocket } from './user-socket.model';

export class UserEventMessage implements IUserEventMessage {
    messageType: UserSocketEvents;
    from: UserSocket;
    data: any;
  
    constructor(messageType: UserSocketEvents, from: UserSocket, data: any) {
      this.messageType = messageType;
      this.from = from;
      this.data = data;
    }
  }
  