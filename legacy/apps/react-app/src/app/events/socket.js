import { io } from 'socket.io-client';
import appConfig from '../config';
import { getMessageEvent } from './events/message';
import { userEvents } from './types';
import { getUserClientConnectedEvent } from './events/user';

export let socket = null;

export const connectWebSocket = (action) => {
  socket = io(`${appConfig.apiGateway}`); //, { transports: ['websocket'], upgrade: false});
  socket.on('connect', () => {
    console.log('Successfully estabished connection with Server');
    const messageEvent = getMessageEvent(
      userEvents.CLIENT_DETAILS,
      { uid: action.payload.user.uid, username: action.payload.user.username },
      getUserClientConnectedEvent(
        {
          uid: action.payload.user.uid,
          username: action.payload.username,
          socketClient: socket.id,
        },
        { publicRooms: action.payload.joinedPublicRooms, privateRooms: null }
      )
    );

    socket.emit(userEvents.CLIENT_DETAILS, messageEvent);
  });
};
