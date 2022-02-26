import { IUserEventMessage, IUserStatusEvent, UserSocketEvents } from '@pokehub/event/user';
import { socket } from '../socket';

export const sendUserStatusMessage = (message: IUserEventMessage<IUserStatusEvent>) => {
    socket.emit(UserSocketEvents.USER_STATUS, message);
}