import { UserSocketEvents } from '..';
import { IUserEventMessage } from './interfaces/user-event-message.interface';
import { UserSocket } from './user-socket.model';

export class UserEventMessage<Data> implements IUserEventMessage<Data> {
    messageType: UserSocketEvents;
    from: UserSocket;
    data: Data;
  
    constructor(messageType: UserSocketEvents, from: UserSocket, data: Data) {
      this.messageType = messageType;
      this.from = from;
      this.data = data;
    }
  }
  