import { io } from 'socket.io-client';

export let socket = null;

export const clientConnect = (detailsMsg) => {
  socket = io('http://localhost:3002');
  socket.on('connect', () => {
    console.log('Connected');
    socket.emit('client-details', detailsMsg);
  });
};

export const sendMessageToPublicChatRoom = (msg) => {
  socket.emit('public-chat-room', msg);
};
