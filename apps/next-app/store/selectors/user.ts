import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { getCurrentOpenedWindow } from './app';
import { WindowTypes } from '../reducers/app';

const userDetails = (state: RootState) => state['user-state'].userDetails;
const joinedRooms = (state: RootState) => state['user-state'].joinedPublicRooms;
const profileSetup = (state: RootState) => state['user-state'].profileSetup;
const status = (state: RootState) => state['user-state'].status;
const socketId = (state: RootState) => state['user-state'].socketId;

export const getUser = createSelector(
  [userDetails],
  (userDetails) => userDetails
);

export const getUsername = createSelector(
  [userDetails],
  (userDetails) => userDetails && userDetails.username
);

export const getUid = createSelector(
  [userDetails],
  (userDetails) => userDetails && userDetails.uid
);

export const getJoinedRooms = createSelector(
  [joinedRooms],
  (joinedRooms) => joinedRooms
);

export const getUserStatus = createSelector(
  [status], (status) => status
);

export const getPublicUser = createSelector(
  [getUsername, getUid],
  (username, uid) => ({ username, uid })
);

export const getSocketId = createSelector(
  [socketId], (socketId) => socketId
);

export const isUserMemberOfCurrentChatRoom = createSelector(
  [getJoinedRooms, getCurrentOpenedWindow],
  (joinedRooms, currentWindow) =>
    currentWindow &&
    currentWindow.type === WindowTypes.CHAT_ROOM &&
    joinedRooms &&
    joinedRooms.find(
      (room) =>
        currentWindow &&
        currentWindow.payload &&
        room.id === currentWindow.payload.id
    )
      ? true
      : false
);

export const isProfileSetup = createSelector(
  [profileSetup], (profileSetup) => profileSetup
);
