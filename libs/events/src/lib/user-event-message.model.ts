import { SocketEvents } from "./socket-events.enum";
import { UserSocket } from '@pokehub/user';
export class UserEventMessage {
    messageType: SocketEvents;
    from: UserSocket;
    data: any;

    constructor(messageType: SocketEvents, from: UserSocket, data: any) {
        this.messageType = messageType;
        this.from = from;
        this.data = data;
    }
}