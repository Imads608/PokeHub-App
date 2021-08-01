import { JOIN_CHAT_ROOM, LEAVE_CHAT_ROOM } from '../actions/types/user';
import { LOGIN_SUCCESS, LOGOUT } from '../actions/types/auth';
import { createReducer } from '@reduxjs/toolkit';

const initialState = {
    uid: null,
    email: null,
    name: null,
    first_name: null, 
    last_name: null,
    username: null,
    emailVerified: null,
    joinedRooms: null
};

export default createReducer(initialState, (builder) => {
    builder
        .addCase(LOGIN_SUCCESS, (state, action) => {
            const { uid, email, name, first_name, last_name, username, emailVerified, joinedRooms } = action.payload.user;
            state.uid = uid
            state.email = email;
            state.name = name;
            state.first_name = first_name;
            state.last_name = last_name;
            state.username = username;
            state.emailVerified = emailVerified;
            state.joinedRooms = joinedRooms;
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