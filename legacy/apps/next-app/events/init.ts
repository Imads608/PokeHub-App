import { RootStore } from '../store/store';
import { createUserNamespaceSocket, getUserNamespaceSocket } from './user/user.socket';
import { createDMNamespaceSocket, getDMNamespaceSocket } from './chat/dm/dm.socket';
import { createRoomNamespaceSocket, getRoomNamespaceSocket } from './chat/room/room.socket';

//export let socket: Socket<DefaultEventsMap, DefaultEventsMap> = null;

export const connectWebSocket = (store: RootStore): void => {
  // Initialize Socket Connections
  createUserNamespaceSocket(store);
  createRoomNamespaceSocket(store);
  createDMNamespaceSocket(store);
};

export const disconnectWebSocket = (store: RootStore): void => {
  getUserNamespaceSocket().disconnect(store.getState()['user-state'].userDetails);
  getDMNamespaceSocket().disconnect();
  getRoomNamespaceSocket().disconnect();
}
