import { IUserEventMessage, IUserStatusEvent } from "@pokehub/event/user";
import { IUserData } from "@pokehub/user/interfaces";

export interface UserNamespaceSocket {
    sendUserStatusMessage: (message: IUserEventMessage<IUserStatusEvent>) => void;
    connect: () => void;
    disconnect: (userData: IUserData) => void;
}