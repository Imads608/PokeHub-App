import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
import appConfig from '../../../config';
import http from '../../../axios';
import { IUserProfileWithToken, IUserProfile } from '@pokehub/user/interfaces';
import { PayloadAction } from '@reduxjs/toolkit';
import { RootStore } from '../../../store/store';
import { SocketNamespaces, websocket_connected, websocket_disconnected } from '../../../store/reducers/user';
import { loadUserProxy } from '../../../api/auth';

export let dmsNamespaceSocket: Socket<DefaultEventsMap, DefaultEventsMap> = null;

export const initDMNamespaceSocket = (action: PayloadAction<IUserProfileWithToken | IUserProfile>, store: RootStore) => {
    dmsNamespaceSocket = io(`${appConfig.chatNotifService}/dms`, { query: { token: http.defaults.headers.Authorization } });

    console.log('initDMNamespaceSocket: Connecting to server with token', http.defaults.headers.Authorization );

    // Connect to Server with DM Namespace
    dmsNamespaceSocket.on('connect', () => {
        console.log('initDMNamespaceSocket: Successfully estabished connection with Server on DMs Namespace');

        // Dispatch Client Id
        store.dispatch(websocket_connected({ socketId: dmsNamespaceSocket.id, namespace: SocketNamespaces.DMS_NAMESPACE }));
    });

    dmsNamespaceSocket.on('disconnect', async (reason) => {
        try {
            console.log('initDMNamespaceSocket onDisconnect Reason: ', reason.toString());
            if (reason.toString() === 'io server disconnect' || reason.toString() === 'io client disconnect') {
                dmsNamespaceSocket.close();
                console.log('initDMNamespaceSocket onDisconnect: Disconnected from DMs Namespace. Refreshing Access Token');
                await loadUserProxy();
                console.log('initDMNamespaceSocket onDisconnect: Successfully refreshed Access Token. Connecting to Server');
                initDMNamespaceSocket(action, store);
            }
        } catch (err) {
            console.error('initDMNamespaceSocket onDisconnect: Got error while trying to restablish connection: ', err);
            store.dispatch(websocket_disconnected());
        }
    })
}