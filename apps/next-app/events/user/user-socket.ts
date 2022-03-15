import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
import appConfig from '../../config';
import http from '../../axios';
import { UserEventMessage, UserSocketEvents, UserSocket } from '@pokehub/event/user';
import { IChatRoomData } from '@pokehub/room/interfaces'
import { IUserProfileWithToken, IUserProfile } from '@pokehub/user/interfaces';
import { PayloadAction } from '@reduxjs/toolkit';
import { RootStore } from '../../store/store';
import { SocketNamespaces, websocket_connected, websocket_disconnected } from '../../store/reducers/user';
import { loadUserProxy } from '../../api/auth';

export let usersNamespaceSocket: Socket<DefaultEventsMap, DefaultEventsMap> = null;

export const initUserNamespaceSocket = (action: PayloadAction<IUserProfileWithToken | IUserProfile>, store: RootStore) => {
    usersNamespaceSocket = io(`${appConfig.userNotifService}`, { query: { token: http.defaults.headers.Authorization } });

    console.log('initUserNamespaceSocket: Connecting to server with token', appConfig.userNotifService, http.defaults.headers.Authorization );

    // Connect to Server with User Namespace
    usersNamespaceSocket.on('connect', () => {
        console.log('initUserNamespaceSocket: Successfully estabished connection with Server on Users Namespace');

        // Join User Rooms on Server
        const messageEvent = new UserEventMessage<{ publicRooms: IChatRoomData[] }>(UserSocketEvents.CLIENT_DETAILS, 
                                new UserSocket(action.payload.user.uid, action.payload.user.username, usersNamespaceSocket.id), 
                                { publicRooms: action.payload.joinedPublicRooms });

        usersNamespaceSocket.emit(UserSocketEvents.CLIENT_DETAILS, messageEvent);

        // Dispatch Client Id
        store.dispatch(websocket_connected({ socketId: usersNamespaceSocket.id, namespace: SocketNamespaces.USERS_NAMESPACE }));
    });

    usersNamespaceSocket.on('disconnect', async (reason) => {
        try {
            console.log('initUserNamespaceSocket onDisconnect: usersNamespaceSocket onDisconnect Reason: ', reason.toString());
            if (reason.toString() === 'io server disconnect' || reason.toString() === 'io client disconnect') {
                usersNamespaceSocket.close();
                console.log('initUserNamespaceSocket onDisconnect: Disconnected from Users Namespace. Refreshing Access Token');
                await loadUserProxy();
                console.log('initUserNamespaceSocket onDisconnect: Successfully refreshed Access Token. Connecting to Server');
                initUserNamespaceSocket(action, store);
            }
        } catch (err) {
            console.error('initUserNamespaceSocket onDisconnect: Got error while trying to restablish connection: ', err);
            store.dispatch(websocket_disconnected());
        }
    })
}