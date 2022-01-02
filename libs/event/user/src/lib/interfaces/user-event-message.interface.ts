import { UserSocketEvents } from "../user-socket-events.enum";
import { IUserSocket } from "./user-socket.interface";

export interface IUserEventMessage {
    messageType: UserSocketEvents;
    from: IUserSocket;
    data: any;
}