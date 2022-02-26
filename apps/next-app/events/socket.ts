import { io, Socket } from 'socket.io-client';
import appConfig from '../config';
import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
import { IUserProfileWithToken, IUserProfile } from '@pokehub/user/interfaces';
import { PayloadAction } from '@reduxjs/toolkit';
import { UserSocketEvents, UserEventMessage, UserSocket } from '@pokehub/event/user';
import { IChatRoomData } from '@pokehub/room/interfaces';
import http from '../axios';
import { LoginSuccessAction } from '../types/auth';
import { RootStore } from '../store/store';
import { websocket_connected } from '../store/reducers/user';

export let socket: Socket<DefaultEventsMap, DefaultEventsMap> = null;

export const connectWebSocket = (action: PayloadAction<IUserProfileWithToken | IUserProfile>, store: RootStore): void => {
  // Create Socket Client
  socket = io(`${appConfig.apiGateway}`, { query: { token: http.defaults.headers.Authorization } }); //, { transports: ['websocket'], upgrade: false});
  console.log('connectWebSocket: Connecting to server with token', http.defaults.headers.Authorization );

  // Connect to Server
  socket.on('connect', () => {
    console.log('connectWebSocket: Successfully estabished connection with Server');

    // Register Client with server
    const messageEvent = new UserEventMessage<{ publicRooms: IChatRoomData[] }>(UserSocketEvents.CLIENT_DETAILS, 
                            new UserSocket(action.payload.user.uid, action.payload.user.username, socket.id), 
                            { publicRooms: action.payload.joinedPublicRooms });

    socket.emit(UserSocketEvents.CLIENT_DETAILS, messageEvent);

    // Dispatch Client Id
    store.dispatch(websocket_connected(socket.id));
  });
};
