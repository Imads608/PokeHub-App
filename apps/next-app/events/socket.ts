import { io, Socket } from 'socket.io-client';
import appConfig from '../config';
import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
import { IUserPublicProfileWithToken } from '@pokehub/user';
import { PayloadAction } from '@reduxjs/toolkit';
import { UserSocketEvents, UserEventMessage, UserSocket } from '@pokehub/event/user';

export let socket: Socket<DefaultEventsMap, DefaultEventsMap> = null;

export const connectWebSocket = (action: PayloadAction<IUserPublicProfileWithToken>) => {
  // Create Socket Client
  socket = io(`${appConfig.apiGateway}`); //, { transports: ['websocket'], upgrade: false});
  console.log('connectWebSocket: Connecting to server')

  // Connect to Server
  socket.on('connect', () => {
    console.log('connectWebSocket: Successfully estabished connection with Server');

    // Register Client with server
    const messageEvent = new UserEventMessage(UserSocketEvents.CLIENT_DETAILS, 
                            new UserSocket(action.payload.user.uid, action.payload.user.username, socket.id), 
                            { publicRooms: action.payload.joinedPublicRooms });

    socket.emit(UserSocketEvents.CLIENT_DETAILS, messageEvent);
  });
};
