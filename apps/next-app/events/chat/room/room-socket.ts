import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
import appConfig from '../../../config';
import http from '../../../axios';
import { IUserProfileWithToken, IUserProfile } from '@pokehub/user/interfaces';
import { PayloadAction } from '@reduxjs/toolkit';
import { RootStore } from '../../../store/store';
import { SocketNamespaces, websocket_connected, websocket_disconnected } from '../../../store/reducers/user';
import { loadUserProxy } from '../../../api/auth';

export let roomsNamespaceSocket: Socket<DefaultEventsMap, DefaultEventsMap> = null;

export const initRoomNamespaceSocket = (store: RootStore) => {
    roomsNamespaceSocket = io(`${appConfig.chatSocketService}/rooms`, { query: { token: http.defaults.headers.Authorization } });

    console.log('initRoomNamespaceSocket: Connecting to server with token', http.defaults.headers.Authorization );

    // Connect to Server with Room Namespace
    roomsNamespaceSocket.on('connect', () => {
        console.log('initRoomNamespaceSocket: Successfully estabished connection with Server on DMs Namespace');

        // Dispatch Client Id
        store.dispatch(websocket_connected({ socketId: roomsNamespaceSocket.id, namespace: SocketNamespaces.ROOMS_NAMESPACE }));
    });

    roomsNamespaceSocket.on('disconnect', async (reason) => {
        try {
            console.log('initRoomNamespaceSocket onDisconnect Reason: ', reason.toString());
            if (reason.toString() === 'io server disconnect' || reason.toString() === 'io client disconnect') {
                roomsNamespaceSocket.close();
                if (store.getState()['auth-state'].isAuthenticated && store.getState()['auth-state'].isEmailVerified) {
                    console.log('initRoomNamespaceSocket onDisconnect: Disconnected from Rooms Namespace. Refreshing Access Token');
                    await loadUserProxy();
                    console.log('initRoomNamespaceSocket onDisconnect: Successfully refreshed Access Token. Connecting to Server');
                    initRoomNamespaceSocket(store);
                }
            }
        } catch (err) {
            console.error('initRoomNamespaceSocket onDisconnect: Got error while trying to restablish connection: ', err);
            store.dispatch(websocket_disconnected());
        }
    })
}

export const disconnectRoomNamespaceSocket = () => {
    console.log('disconnectRoomNamespaceSocket: Closing Websocket Connection');
    roomsNamespaceSocket.close();
    console.log('disconnectRoomNamespaceSocket: Successfully closed Websocket Connection');
}