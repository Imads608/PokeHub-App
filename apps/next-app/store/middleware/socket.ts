//mport { JOIN_CHAT_ROOM, JOIN_PUBLIC_CHATROOM, LOGIN_SUCCESS, PUBLIC_CHATROOM_MESSAGE_SENT, SEND_CLIENT_DETAILS, SEND_PUBLIC_CHATROOM_MESSAGE, CHATROOM_MESSAGE, CHATROOM_MESSAGE_SENT, DM_SENT, DIRECT_MESSAGE, DM_RECEIVED } from '../actions/types';
import { IUserStatusData } from '@pokehub/user/interfaces';
import { PayloadAction } from '@reduxjs/toolkit';
import { connectWebSocket } from '../../events/socket';
import { login_success } from '../actions/common';
import { status_update } from '../reducers/user';

const registerGlobalEventHandlers = (store) => {
  //store.dispatch(registerMessagesEventHandler(socket));
  //store.dispatch(registerUserNotificationEventHandler(socket));
};

export const connectWebSocketMiddleware = (store) => (next) => (action) => {
  console.log('connectWebSocketMiddleware: Checking for any action to be taken');
  switch (action.type) {
    case login_success.toString():
      handleLoginSuccess(action);
      break;
    case status_update.toString():
      handleUserStatusUpdate(action as PayloadAction<IUserStatusData>);
      break;
  }
  return next(action);
};

const handleLoginSuccess = (action) => {
  console.log('Socket Middleware: handleLoginSuccess: Establishing connection with Server');
  connectWebSocket(action);
}

const handleUserStatusUpdate = (action: PayloadAction<IUserStatusData>) => {
  console.log('Socket Middleware: handleUserStatusUpdate: Sending User Status Update to Server');
}
