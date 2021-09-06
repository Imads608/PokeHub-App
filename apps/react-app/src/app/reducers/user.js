import { JOIN_CHAT_ROOM, LEAVE_CHAT_ROOM } from '../actions/types/user';
import { LOGIN_SUCCESS, LOGOUT } from '../actions/types/auth';
import { createReducer } from '@reduxjs/toolkit';

const initialState = {
    uid: null,
    email: null,
    name: null,
    firstName: null, 
    lastName: null,
    username: null,
    emailVerified: null,
    joinedPublicRooms: null
};

export default createReducer(initialState, (builder) => {
    builder
        .addCase(LOGIN_SUCCESS, (state, action) => {
            const { uid, email, name, firstName, lastName, username, emailVerified } = action.payload.user;
            console.log('Action Payload is', action.payload);
            state.uid = uid
            state.email = email;
            state.name = name;
            state.firstName = firstName;
            state.lastName = lastName;
            state.username = username;
            state.emailVerified = emailVerified;
            state.joinedPublicRooms = action.payload.joinedPublicRooms;
        })
        .addCase(LOGOUT, (state, action) => {
            state.uid = null; state.email = null; state.name = null; state.first_name = null; state.last_name = null; state.username = null;
            state.emailVerified = null; state.joinedRooms = null;
        })
        .addCase(JOIN_CHAT_ROOM, (state, action) => {
            state.joinedRooms = action.payload;
        })
        .addCase(LEAVE_CHAT_ROOM, (state, action) => {
            state.joinedRooms = action.payload;
        })
        .addDefaultCase((state, action) => {
        })
    });