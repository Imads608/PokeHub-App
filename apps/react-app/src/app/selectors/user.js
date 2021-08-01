import { createSelector } from '@reduxjs/toolkit';
import { getCurrentOpenedWindow } from './app';

const user = state => state.user;
const userName = state => state.user.username;
const userId = state => state.user.uid;
const userJoinedRooms = state => state.user.joinedRooms;

export const getUser = createSelector(
    [user], userData => userData
);

export const getUsername = createSelector(
    [userName], username => username
);

export const getUid = createSelector(
    [userId], uid => uid
);

export const getJoinedRooms = createSelector(
    [userJoinedRooms], joinedRooms => joinedRooms
);

export const getPublicUser = createSelector(
    [getUsername, getUid], (username, uid) => ({ username, uid })
);

export const isUserMemberOfCurrentChatRoom = createSelector(
    [getJoinedRooms, getCurrentOpenedWindow], (joinedRooms, currentWindow) => (
        currentWindow.type === 'CHAT_ROOM' && joinedRooms.find(room => room.id === currentWindow.payload.id) ? true : false
    )
);

/*export const isUserMemberOfCurrentChatRoom = createSelector(
    [getUser, getMemoCurrentOpenedWindow], (joinedRooms, currentWindow) => (
        currentWindow.type = 'CHAT_ROOM' && joinedRooms.find(room => room.id === currentWindow.payload.id)
    )
);*/
