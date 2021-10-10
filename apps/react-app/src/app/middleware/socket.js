//mport { JOIN_CHAT_ROOM, JOIN_PUBLIC_CHATROOM, LOGIN_SUCCESS, PUBLIC_CHATROOM_MESSAGE_SENT, SEND_CLIENT_DETAILS, SEND_PUBLIC_CHATROOM_MESSAGE, CHATROOM_MESSAGE, CHATROOM_MESSAGE_SENT, DM_SENT, DIRECT_MESSAGE, DM_RECEIVED } from '../actions/types';
import { LOGIN_SUCCESS } from '../actions/types/auth';
import { CHATROOM_MESSAGE_SENT, DM_SENT, DM_RECEIVED } from '../actions/types/chat';
import { registerMessagesEventHandler } from '../events/event-handlers/chat';
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
            //socket.emit(eventTypes.CHATROOM_MESSAGE, { ...action.payload, socketId: socket.id, type: eventTypes.CHATROOM_MESSAGE });
            break;
        case DM_SENT:
            console.log('Sending Message to DM Recipient', action);
            //socket.emit(eventTypes.DIRECT_MESSAGE, { ...action.payload, socketId: socket.id, type: eventTypes.DIRECT_MESSAGE });
            break;
        case DM_RECEIVED: 
            console.log('Joining DM SocketIO Room', action, socket);
            break;
        default:
            ;
    }
    return next(action);
}