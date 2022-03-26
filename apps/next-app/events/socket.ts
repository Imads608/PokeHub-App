import { IUserProfileWithToken, IUserProfile } from '@pokehub/user/interfaces';
import { PayloadAction } from '@reduxjs/toolkit';
import { RootStore } from '../store/store';
import { disconnectUserNamespaceSocket, initUserNamespaceSocket } from './user/user-socket';
import { disconnectRoomNamespaceSocket, initRoomNamespaceSocket } from './chat/room/room-socket';
import { disconnectDMNamespaceSocket, initDMNamespaceSocket } from './chat/dm/dm-socket';

//export let socket: Socket<DefaultEventsMap, DefaultEventsMap> = null;

export const connectWebSocket = (action: PayloadAction<IUserProfileWithToken | IUserProfile>, store: RootStore): void => {
  // Initialize Socket Connections
  initUserNamespaceSocket(action, store);
  initRoomNamespaceSocket(action, store);
  initDMNamespaceSocket(action, store);
};

export const disconnectWebSocket = (store: RootStore): void => {
  disconnectUserNamespaceSocket(store.getState()['user-state'].userDetails);
  disconnectDMNamespaceSocket();
  disconnectRoomNamespaceSocket();
}
