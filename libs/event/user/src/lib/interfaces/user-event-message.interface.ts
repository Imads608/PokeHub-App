import { UserSocketEvents } from "../user-socket-events.enum";
import { IUserSocket } from "./user-socket.interface";

export interface IUserEventMessage<Data> {
    messageType: UserSocketEvents;
    from: IUserSocket;
    data: Data;
}