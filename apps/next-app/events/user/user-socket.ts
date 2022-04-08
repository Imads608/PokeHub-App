import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
import appConfig from '../../config';
import http from '../../axios';
import { UserEventMessage, UserSocketEvents, UserSocket } from '@pokehub/event/user';
import { IChatRoomData } from '@pokehub/room/interfaces'
import { IUserProfileWithToken, IUserProfile, IUserData } from '@pokehub/user/interfaces';
import { PayloadAction } from '@reduxjs/toolkit';
import { RootStore } from '../../store/store';
import { SocketNamespaces, websocket_connected, websocket_disconnected } from '../../store/reducers/user';
import { loadUserProxy } from '../../api/auth';
import { UserProfile } from '@pokehub/user/models';

export let usersNamespaceSocket: Socket<DefaultEventsMap, DefaultEventsMap> = null;

export const initUserNamespaceSocket = (store: RootStore) => {
    usersNamespaceSocket = io(`${appConfig.userSocketService}`, { query: { token: http.defaults.headers.Authorization } });
    const userState = store.getState()['user-state'];
    console.log('initUserNamespaceSocket: Connecting to server with token', appConfig.userSocketService, http.defaults.headers.Authorization );

    // Connect to Server with User Namespace
    usersNamespaceSocket.on('connect', () => {
        console.log('initUserNamespaceSocket: Successfully estabished connection with Server on Users Namespace');

        // Join User Rooms on Server
        const messageEvent = new UserEventMessage<IUserProfile>(UserSocketEvents.LOGGED_IN, 
                                new UserSocket(userState.userDetails.uid, userState.userDetails.username, usersNamespaceSocket.id), 
                                new UserProfile(userState.userDetails, userState.joinedPublicRooms));

        usersNamespaceSocket.emit(UserSocketEvents.LOGGED_IN, messageEvent);

        // Dispatch Client Id
        store.dispatch(websocket_connected({ socketId: usersNamespaceSocket.id, namespace: SocketNamespaces.USERS_NAMESPACE }));
    });

    usersNamespaceSocket.on('disconnect', async (reason) => {
        try {
            console.log('initUserNamespaceSocket onDisconnect: usersNamespaceSocket onDisconnect Reason: ', reason.toString());
            if (reason.toString() === 'io server disconnect' || reason.toString() === 'io client disconnect') {
                usersNamespaceSocket.close();
                if (store.getState()['auth-state'].isAuthenticated && store.getState()['auth-state'].isEmailVerified) {
                    console.log('initUserNamespaceSocket onDisconnect: Disconnected from Users Namespace. Refreshing Access Token');
                    await loadUserProxy();
                    console.log('initUserNamespaceSocket onDisconnect: Successfully refreshed Access Token. Connecting to Server');
                    initUserNamespaceSocket(store);
                }
            }
        } catch (err) {
            console.error('initUserNamespaceSocket onDisconnect: Got error while trying to restablish connection: ', err);
            store.dispatch(websocket_disconnected());
        }
    })
}

export const disconnectUserNamespaceSocket = (userData: IUserData) => {
    console.log('disconnectUserNamespaceSocket: Sending logout message to Server and closing Websocket connection');
    const messageEvent = new UserEventMessage<IUserData>(UserSocketEvents.LOGGED_OUT, 
        new UserSocket(userData.uid, userData.username, usersNamespaceSocket.id), userData);
    usersNamespaceSocket.emit(UserSocketEvents.LOGGED_OUT, messageEvent);
    usersNamespaceSocket.close();
    console.log('disconnectUserNamespaceSocket: Successfully sent logout message to User and closed Websocket Connection');
}