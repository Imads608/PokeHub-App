import {
  JOIN_CHAT_ROOM,
  LEAVE_CHAT_ROOM,
  USER_AWAY,
  USER_LOADED,
  USER_ONLINE,
} from './types/user';

export const joinedChatRoom = (joinedRooms) => {
  return {
    type: JOIN_CHAT_ROOM,
    payload: joinedRooms,
  };
};

export const leftChatRoom = (joinedRooms) => {
  return {
    type: LEAVE_CHAT_ROOM,
    payload: joinedRooms,
  };
};

export const userIsOnline = (uid, username) => {
  return {
    type: USER_ONLINE,
    payload: { uid, username },
  };
};

export const userIsAway = (uid, username) => {
  return {
    type: USER_AWAY,
    payload: { uid, username },
  };
};
