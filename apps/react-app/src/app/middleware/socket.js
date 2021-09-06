//mport { JOIN_CHAT_ROOM, JOIN_PUBLIC_CHATROOM, LOGIN_SUCCESS, PUBLIC_CHATROOM_MESSAGE_SENT, SEND_CLIENT_DETAILS, SEND_PUBLIC_CHATROOM_MESSAGE, CHATROOM_MESSAGE, CHATROOM_MESSAGE_SENT, DM_SENT, DIRECT_MESSAGE, DM_RECEIVED } from '../actions/types';
import { LOGIN_SUCCESS } from '../actions/types/auth';
import { CHATROOM_MESSAGE_SENT, DM_SENT, DM_RECEIVED } from '../actions/types/chat';
import { SEND_CLIENT_DETAILS, CHATROOM_MESSAGE, DIRECT_MESSAGE, JOIN_DMs } from '../types/socket';
import { io } from 'socket.io-client';
import { registerUserNotificationEventHandler } from '../actions/app';
import { registerMessagesEventHandler } from '../actions/chat';
import appConfig from '../config';

export let socket = null;
export const connectWebSocketMiddleware = (store) => (next) => (action) => {
    switch (action.type) {
        case LOGIN_SUCCESS: 
            socket = io(`${appConfig.chatService}`, { transports: ['websocket'], upgrade: false});
            socket.on("connect", () => {
                console.log('Connected to Websocket');
                socket.emit(SEND_CLIENT_DETAILS, { uid: action.payload.user.uid, publicRooms: action.payload.joinedPublicRooms, privateRooms: null/*action.payload.userData.privateRooms*/ });
            });
            store.dispatch(registerMessagesEventHandler(socket));
            store.dispatch(registerUserNotificationEventHandler(socket));
            break;
        case CHATROOM_MESSAGE_SENT:
            console.log('Emitting message ', action);
            socket.emit(CHATROOM_MESSAGE, { ...action.payload, socketId: socket.id, type: CHATROOM_MESSAGE });
            break;
        case DM_SENT:
            console.log('Emitting message ', action);
            /*if (!socket.rooms || socket.rooms.indexOf(action.payload.dm.id) < 0) {
                console.log('Joining DM');
                socket.emit(JOIN_DMs, [action.payload.roomId]);
            }*/
            socket.emit(DIRECT_MESSAGE, { ...action.payload, socketId: socket.id, type: DIRECT_MESSAGE });
            break;
        case DM_RECEIVED: 
            console.log('Emitting message', action, socket);
            /*if (!socket.rooms || socket.rooms.indexOf(action.payload.dm.id) < 0) {
                console.log('Joining DM');
                socket.emit(JOIN_DMs, [action.payload.dm.id]);
            }*/
            break;
        default:
            ;
    }
    return next(action);
}