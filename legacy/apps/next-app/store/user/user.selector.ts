import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { getCurrentOpenedWindow } from '../app/app.selector';
import { WindowTypes } from '../app/app.reducer';

const userDetails = (state: RootState) => state['user-state'].userDetails;
const joinedRooms = (state: RootState) => state['user-state'].joinedPublicRooms;
const profileSetup = (state: RootState) => state['user-state'].profileSetup;
const status = (state: RootState) => state['user-state'].userDetails?.status;
const clientIds = (state: RootState) => state['user-state'].clientIds;

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

export const getUsersNSClientId = createSelector(
  [clientIds], (clientIds) => clientIds?.usersNS
);

export const getRoomsNSClientId = createSelector(
  [clientIds], (clientIds) => clientIds?.roomsNS
);

export const getDMsNSClientId = createSelector(
  [clientIds], (clientIds) => clientIds?.dmsNS
);

export const getAllNSClientIds = createSelector(
  [clientIds], (clientIds) => clientIds
);

export const getIsRefreshNeeded = createSelector(
  [clientIds], (clientIds) => clientIds ? clientIds.isRefreshNeeded : false
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
