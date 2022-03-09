import { IUserEventMessage, IUserStatusEvent, UserSocketEvents } from '@pokehub/event/user';
import { usersNamespaceSocket } from './user-socket';

export const sendUserStatusMessage = (message: IUserEventMessage<IUserStatusEvent>) => {
    usersNamespaceSocket.emit(UserSocketEvents.USER_STATUS, message);
}