//mport { JOIN_CHAT_ROOM, JOIN_PUBLIC_CHATROOM, LOGIN_SUCCESS, PUBLIC_CHATROOM_MESSAGE_SENT, SEND_CLIENT_DETAILS, SEND_PUBLIC_CHATROOM_MESSAGE, CHATROOM_MESSAGE, CHATROOM_MESSAGE_SENT, DM_SENT, DIRECT_MESSAGE, DM_RECEIVED } from '../actions/types';
import { connectWebSocket } from '../../events/socket';
import { login_success } from '../actions/common';

const registerGlobalEventHandlers = (store) => {
  //store.dispatch(registerMessagesEventHandler(socket));
  //store.dispatch(registerUserNotificationEventHandler(socket));
};

export const connectWebSocketMiddleware = (store) => (next) => (action) => {
  console.log('In Socket Middleware');
  switch (action.type) {
    case login_success.toString():
      console.log('Establishing Connection with Server');
      connectWebSocket(action);
      //registerGlobalEventHandlers(store);
      break;
  }
  return next(action);
};
