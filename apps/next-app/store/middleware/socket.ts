//mport { JOIN_CHAT_ROOM, JOIN_PUBLIC_CHATROOM, LOGIN_SUCCESS, PUBLIC_CHATROOM_MESSAGE_SENT, SEND_CLIENT_DETAILS, SEND_PUBLIC_CHATROOM_MESSAGE, CHATROOM_MESSAGE, CHATROOM_MESSAGE_SENT, DM_SENT, DIRECT_MESSAGE, DM_RECEIVED } from '../actions/types';
import { IUserProfile, IUserProfileWithToken, IUserStatusData } from '@pokehub/user/interfaces';
import { PayloadAction } from '@reduxjs/toolkit';
import { connectWebSocket, disconnectWebSocket } from '../../events/socket';
import { login_success, logout } from '../actions/common';
import { start_websocket_connection, status_update } from '../reducers/user';
import { sendUserStatusMessage } from '../../events/user/user-events';
import { UserSocketEvents } from '@pokehub/event/user';
import { LoginSuccessAction } from '../../types/auth';
import { RootStore } from '../store';
import { UserStatusUpdate } from '../../types/user';

const registerGlobalEventHandlers = (store) => {
  //store.dispatch(registerMessagesEventHandler(socket));
  //store.dispatch(registerUserNotificationEventHandler(socket));
};

export const connectWebSocketMiddleware = (store) => (next) => (action) => {
  console.log(`connectWebSocketMiddleware: Starting to check for any middleware to execut for action ${action.type}`);
  switch (action.type) {
    case status_update.toString():
      handleUserStatusUpdate(action as PayloadAction<UserStatusUpdate>, (action as PayloadAction<UserStatusUpdate>).payload.isHardUpdate);
      break;
    case logout.toString():
      handleLogoutSuccess(store);
      break;
    case start_websocket_connection.toString():
      handleInitSocketConnections(store);
      break;
  }

  console.log('Action After Middleware: ', action.payload);
  return next(action);
};

const handleInitSocketConnections = (store: RootStore) => {
  console.log('Socket Middleware: handleInitSocketConnections: Establishing connection with Server');
  connectWebSocket(store);
}

const handleUserStatusUpdate = (action: PayloadAction<UserStatusUpdate>, isHardUpdate: boolean) => {
  console.log('Socket Middleware: handleUserStatusUpdate: Sending User Status Update to Server');
  sendUserStatusMessage({ 
    data: { 
      status: action.payload, isHardUpdate 
    }, from: { socketClient: action.payload.socketId, uid: action.payload.uid, username: action.payload.username  }, messageType: UserSocketEvents.USER_STATUS 
  });
}

const handleLogoutSuccess = (store: RootStore) => {
  console.log('Socket Middleware: handleLogoutSuccess: Sending User Status Update to Server');
  disconnectWebSocket(store);
}
