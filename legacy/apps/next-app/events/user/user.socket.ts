import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io-client/dist/socket.io';
import appConfig from '../../config';
import http from '../../axios';
import { UserEventMessage, UserSocketEvents, UserSocket, IUserEventMessage, IUserStatusEvent } from '@pokehub/event/user';
import { IUserProfile, IUserData } from '@pokehub/user/interfaces';
import { RootStore } from '../../store/store';
import { SocketNamespaces, websocket_connected, websocket_disconnected } from '../../store/user/user.reducer';
import { loadUserProxy } from '../../api/auth';
import { UserProfile } from '@pokehub/user/models';
import { UserNamespaceSocket } from './user-socket.model';

let userNamespaceSocket: UserNamespaceSocket;

export const getUserNamespaceSocket = (store?: RootStore): UserNamespaceSocket | undefined => {
    return userNamespaceSocket || (store && createUserNamespaceSocket(store));
}

export const createUserNamespaceSocket = (store: RootStore): UserNamespaceSocket => {
    const socket = io(`${appConfig.userSocketService}`, { auth: { token: http.defaults.headers.Authorization } });

    userNamespaceSocket = {
        connect: () => {
            socket.on('connect', () => handleConnect(socket, store));
            socket.on('disconnect', async (reason) => await handleDisconnect(socket, store, reason));
            socket.on('connect_error', async () => await handleConnectError(socket, store));
        },

        disconnect: (userData: IUserData) => {
            console.log('disconnectUserNamespaceSocket: Sending logout message to Server and closing Websocket connection');
            const messageEvent = new UserEventMessage<IUserData>(UserSocketEvents.LOGGED_OUT, 
                new UserSocket(userData.uid, userData.username, socket.id), userData);
            socket.emit(UserSocketEvents.LOGGED_OUT, messageEvent);
            socket.close();
            console.log('disconnectUserNamespaceSocket: Successfully sent logout message to User and closed Websocket Connection');
        },

        sendUserStatusMessage: (message: IUserEventMessage<IUserStatusEvent>) => {
            socket.emit(UserSocketEvents.USER_STATUS, message);
        }
    }

    userNamespaceSocket.connect();

    return userNamespaceSocket;
}

const handleConnect = (socket: Socket<DefaultEventsMap, DefaultEventsMap>, store: RootStore) => {
    console.log('initUserNamespaceSocket: Successfully estabished connection with Server on Users Namespace');
    const userState = store.getState()['user-state'];

    // Join User Rooms on Server
    const messageEvent = new UserEventMessage<IUserProfile>(UserSocketEvents.LOGGED_IN, 
                            new UserSocket(userState.userDetails.uid, userState.userDetails.username, socket.id), 
                            new UserProfile(userState.userDetails, userState.joinedPublicRooms));

    socket.emit(UserSocketEvents.LOGGED_IN, messageEvent);

    // Dispatch Client Id
    store.dispatch(websocket_connected({ socketId: socket.id, namespace: SocketNamespaces.USERS_NAMESPACE }));
}

const handleConnectError = async (socket: Socket<DefaultEventsMap, DefaultEventsMap>, store: RootStore) => {
    try {
        if (store.getState()['auth-state'].isAuthenticated && store.getState()['auth-state'].isEmailVerified) {
            console.log('User Socket handleConnectError: Starting to handle reconnection');
            await loadUserProxy();
            console.log('User Socket handleConnectError: Successfully refreshed Access Token');
            socket.auth['token'] = http.defaults.headers.Authorization;
            socket.connect();
        }
    } catch (err) {
        console.error('User Socket handleConnectError: Got error while trying to restablish connection: ', err);
        store.dispatch(websocket_disconnected());
    }
}

const handleDisconnect = async (socket: Socket<DefaultEventsMap, DefaultEventsMap>, store: RootStore, reason: Socket.DisconnectReason) => {
    console.log('User Socket handleDisconnect Reason: ', reason.toString());
    if (reason.toString() === 'io server disconnect' || reason.toString() === 'io client disconnect') {
        handleConnectError(socket, store);
    }
}