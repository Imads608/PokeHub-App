//mport { JOIN_CHAT_ROOM, JOIN_PUBLIC_CHATROOM, LOGIN_SUCCESS, PUBLIC_CHATROOM_MESSAGE_SENT, SEND_CLIENT_DETAILS, SEND_PUBLIC_CHATROOM_MESSAGE, CHATROOM_MESSAGE, CHATROOM_MESSAGE_SENT, DM_SENT, DIRECT_MESSAGE, DM_RECEIVED } from '../actions/types';
import { LOGIN_SUCCESS } from '../actions/types/auth';
import { CHATROOM_MESSAGE_SENT, DM_SENT, DM_RECEIVED } from '../actions/types/chat';
import { SEND_CLIENT_DETAILS, CHATROOM_MESSAGE, DIRECT_MESSAGE, JOIN_DMs, eventTypes } from '../types/socket';
import { io } from 'socket.io-client';
//import { registerUserNotificationEventHandler } from '../events/event-handlers/user';
import { registerMessagesEventHandler } from '../events/event-handlers/chat';
import { getMessageEvent } from '../events/events/message';
import { getUserStatusEvent } from '../events/events/user';
import { userEvents } from '../events/types';
import { USER_AWAY, USER_ONLINE } from '../actions/types/user';
import { socket, connectWebSocket } from '../events/socket';

const registerGlobalEventHandlers = (store) => {
    store.dispatch(registerMessagesEventHandler(socket));
    //store.dispatch(registerUserNotificationEventHandler(socket));
}

export const connectWebSocketMiddleware = (store) => (next) => (action) => {
    switch (action.type) {
        case LOGIN_SUCCESS:
            console.log('Establishing Connection with Server'); 
            connectWebSocket(action);
            registerGlobalEventHandlers(store);
            break;
        case CHATROOM_MESSAGE_SENT:
            console.log('Broadcasting Chat Room Message to Participants', action);
            socket.emit(eventTypes.CHATROOM_MESSAGE, { ...action.payload, socketId: socket.id, type: eventTypes.CHATROOM_MESSAGE });
            break;
        case DM_SENT:
            console.log('Sending Message to DM Recipient', action);
            /*if (!socket.rooms || socket.rooms.indexOf(action.payload.dm.id) < 0) {
                console.log('Joining DM');
                socket.emit(JOIN_DMs, [action.payload.roomId]);
            }*/
            socket.emit(eventTypes.DIRECT_MESSAGE, { ...action.payload, socketId: socket.id, type: eventTypes.DIRECT_MESSAGE });
            break;
        case DM_RECEIVED: 
            console.log('Joining DM SocketIO Room', action, socket);
            /*if (!socket.rooms || socket.rooms.indexOf(action.payload.dm.id) < 0) {
                console.log('Joining DM');
                socket.emit(JOIN_DMs, [action.payload.dm.id]);
            }*/
            break;
        case USER_ONLINE:
            //getMessageEvent(userEvents.USER_STATUS, getUserStatusEvent())
            //setMessageEvent(eventTypes.USER_AVAILABLE, { ...action.payload, socketClient: socket.id }, null);
            //socket.emit(eventTypes.USER_AVAILABLE, setMessageEvent(eventTypes.USER_AVAILABLE, null, null));
            break;
        case USER_AWAY:
            socket.emit(eventTypes.USER_AWAY, { ...action.payload });
            break;
        default:
            ;
    }
    return next(action);
}