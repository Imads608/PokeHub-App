import { io, Socket,  } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io-client/dist/socket.io';
import appConfig from '../../../config';
import http from '../../../axios';
import { RootStore } from '../../../store/store';
import { SocketNamespaces, websocket_connected, websocket_disconnected } from '../../../store/user/user.reducer';
import { loadUserProxy } from '../../../api/auth';
import { DMNamespaceSocket } from './dm-socket.model';

let dmNamespaceSocket: DMNamespaceSocket;

export const getDMNamespaceSocket = (store?: RootStore): DMNamespaceSocket | undefined => {
    return dmNamespaceSocket || (store && createDMNamespaceSocket(store));
}

export const createDMNamespaceSocket = (store: RootStore): DMNamespaceSocket => {
    const socket = io(`${appConfig.chatSocketService}/dms`, { auth: { token: http.defaults.headers.Authorization } });

    dmNamespaceSocket = {
        connect: () => {
            socket.on('connect', () => handleConnect(socket, store));
            //socket.on('disconnect', async (reason) => await handleDisconnect(socket, store, reason));
            socket.on('connect_error', async () => await handleConnectError(socket, store));
        },
        disconnect: () => {
            console.log('disconnectDMNamespaceSocket: Closing Websocket Connection');
            socket.close();
            console.log('disconnecDMNamespaceSocket: Successfully Closed Websocket Connection');
        }
    }

    dmNamespaceSocket.connect();

    return dmNamespaceSocket;
}

const handleConnect = (socket: Socket<DefaultEventsMap, DefaultEventsMap>, store: RootStore) => {
    console.log('initDMNamespaceSocket: Successfully estabished connection with Server on DMs Namespace');

    // Dispatch Client Id
    store.dispatch(websocket_connected({ socketId: socket.id, namespace: SocketNamespaces.DMS_NAMESPACE }));
}

const handleConnectError = async (socket: Socket<DefaultEventsMap, DefaultEventsMap>, store: RootStore) => {
    try {
        if (store.getState()['auth-state'].isAuthenticated && store.getState()['auth-state'].isEmailVerified) {
            console.log('DM Socket handleConnectError: Starting to handle reconnection');
            await loadUserProxy();
            console.log('DM Socket handleConnectError: Successfully refreshed Access Token');
            socket.auth['token'] = http.defaults.headers.Authorization;
            socket.connect();
        }
    } catch (err) {
        console.error('DM Socket handleConnectError: Got error while trying to restablish connection: ', err);
        store.dispatch(websocket_disconnected());
    }
}

const handleDisconnect = async (socket: Socket<DefaultEventsMap, DefaultEventsMap>, store: RootStore, reason: Socket.DisconnectReason) => {
    console.log('DM Socket handleDisconnect Reason: ', reason.toString());
    if (reason.toString() === 'io server disconnect' || reason.toString() === 'io client disconnect') {
        handleConnectError(socket, store);
    }
}