import { socket } from '../socket';
import { userEvents } from '../types';

export const emitUserClientConnectedDetails = (messageEvent) => {
    socket.emit(userEvents.CLIENT_DETAILS, messageEvent);

}

export const emitUserStatus = (messageEvent) => {
    socket.emit(userEvents.USER_STATUS, messageEvent);
}