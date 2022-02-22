import { IUserEventMessage, IUserStatusEvent, UserEventTopics } from '@pokehub/event/user';
import { socket } from '../socket';

export const sendUserStatusMessage = (message: IUserEventMessage<IUserStatusEvent>) => {
    socket.emit(UserEventTopics.USER_STATUS, message);
}