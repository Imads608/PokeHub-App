import { PayloadAction } from '@reduxjs/toolkit';
import { connectWebSocket, disconnectWebSocket } from '../../events/init';
import { logout } from '../common/common.actions';
import { start_websocket_connection, status_update } from '../user/user.reducer';
import { UserSocketEvents } from '@pokehub/event/user';
import { RootStore } from '../store';
import { UserStatusUpdate } from '../../types/user';
import { getUserNamespaceSocket } from 'apps/next-app/events/user/user.socket';

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
  getUserNamespaceSocket().sendUserStatusMessage({ 
    data: { 
      status: action.payload, isHardUpdate 
    }, from: { socketClient: action.payload.socketId, uid: action.payload.uid, username: action.payload.username  }, messageType: UserSocketEvents.USER_STATUS 
  });
}

const handleLogoutSuccess = (store: RootStore) => {
  console.log('Socket Middleware: handleLogoutSuccess: Sending User Status Update to Server');
  disconnectWebSocket(store);
}
