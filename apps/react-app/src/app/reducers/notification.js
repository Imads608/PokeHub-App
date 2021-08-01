import { ERROR_NOTIFICATION, RESET_NOTIFICATION } from '../actions/types/notification';
import { AUTH_FAILURE, LOGIN_SUCCESS } from '../actions/types/auth';
import { JOIN_CHAT_ROOM, LEAVE_CHAT_ROOM } from '../actions/types/user';
import { RESET_APP_ERROR, REQUEST_FAILURE } from '../actions/types/app';
import { ERROR, SUCCESS } from '../types/notification';
import { createReducer } from '@reduxjs/toolkit';

const initialState = {
    appNotification: {
        type: '',
        message: null,
        component: null,
        desiredState: null,
        otherProps: null
    },
    currentNotifications: [],
    userNotifications: []
}

export default createReducer(initialState, (builder) => {
    builder
        .addCase(JOIN_CHAT_ROOM, (state, action) => {
            state.appNotification = { type: SUCCESS, message: 'Successfully joined Chat Room', component: 'AlertNotification', desiredState: null, otherProps: null };
        })
        .addCase(LEAVE_CHAT_ROOM, (state, action) => {
            state.appNotification = { type: SUCCESS, message: 'Successfully left Chat Room', component: 'AlertNotification', desiredState: null, otherProps: null };
        })
        .addCase(ERROR_NOTIFICATION, (state, action) => {
            state.appNotification = action.payload;
        })
        .addMatcher((action) => action.type === RESET_APP_ERROR || action.type === RESET_NOTIFICATION, (state, action) => {
            state.appNotification = { type: '', message: null, component: null, desiredState: null, otherProps: null };
        })
        .addMatcher((action) => action.type === AUTH_FAILURE || action.type === REQUEST_FAILURE, (state, action) => {
            state.appNotification = { ...state.appNotification, type: ERROR, message: action.payload.message, component: 'AlertNotification', desiredState: LOGIN_SUCCESS };
        })
        .addDefaultCase((state, action) => {
        })
    });