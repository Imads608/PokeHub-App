import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io-client/dist/socket.io';
import appConfig from '../../../config';
import http from '../../../axios';
import { RootStore } from '../../../store/store';
import { SocketNamespaces, websocket_connected, websocket_disconnected } from '../../../store/user/user.reducer';
import { loadUserProxy } from '../../../api/auth';
import { RoomNamespaceSocket } from './room-socket.model';

let roomNamespaceSocket: RoomNamespaceSocket;

export const getRoomNamespaceSocket = (store?: RootStore) => {
    return roomNamespaceSocket || (store && createRoomNamespaceSocket(store));
}

export const createRoomNamespaceSocket = (store: RootStore) => {
    const socket = io(`${appConfig.chatSocketService}/rooms`, { auth: { token: http.defaults.headers.Authorization } });
    
    roomNamespaceSocket = {
        connect: () => {
            socket.on('connect', () => handleConnect(socket, store));
            //socket.on('disconnect', async (reason) => await handleDisconnect(socket, store, reason));
            socket.on('connect_error', async () => await handleConnectError(socket, store));
        },
        disconnect: () => {
            console.log('disconnectRoomNamespaceSocket: Closing Websocket Connection');
            socket.close();
            console.log('disconnectRoomNamespaceSocket: Successfully closed Websocket Connection');
        }
    }

    roomNamespaceSocket.connect();

    return roomNamespaceSocket;
}

const handleConnect = (socket: Socket<DefaultEventsMap, DefaultEventsMap>, store: RootStore) => {
    console.log('initRoomNamespaceSocket: Successfully estabished connection with Server on DMs Namespace');

    // Dispatch Client Id
    store.dispatch(websocket_connected({ socketId: socket.id, namespace: SocketNamespaces.ROOMS_NAMESPACE }));
}
const handleConnectError = async (socket: Socket<DefaultEventsMap, DefaultEventsMap>, store: RootStore) => {
    try {
        if (store.getState()['auth-state'].isAuthenticated && store.getState()['auth-state'].isEmailVerified) {
            console.log('Room Socket handleConnectError: Starting to handle reconnection');
            await loadUserProxy();
            console.log('Room Socket handleConnectError: Successfully refreshed Access Token');
            socket.auth['token'] = http.defaults.headers.Authorization;
            socket.connect();
        }
    } catch (err) {
        console.error('Room Socket handleConnectError: Got error while trying to restablish connection: ', err);
        store.dispatch(websocket_disconnected());
    }
}

const handleDisconnect = async (socket: Socket<DefaultEventsMap, DefaultEventsMap>, store: RootStore, reason: Socket.DisconnectReason) => {
    console.log('Room Socket handleDisconnect Reason: ', reason.toString());
    if (reason.toString() === 'io server disconnect' || reason.toString() === 'io client disconnect') {
        handleConnectError(socket, store);
    }
}