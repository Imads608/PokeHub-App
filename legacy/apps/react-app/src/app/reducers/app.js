import {
  REQUEST_START,
  REQUEST_FAILURE,
  SET_OPEN_WINDOW,
  RESET_APP_ERROR,
  APP_LOADED,
} from '../actions/types/app';
import { AUTH_FAILURE } from '../actions/types/auth';
import { GET_CHAT_ROOMS_SUCCESS } from '../actions/types/chat';
import { JOIN_CHAT_ROOM, LEAVE_CHAT_ROOM } from '../actions/types/user';
import { createReducer } from '@reduxjs/toolkit';

const initialState = {
  loading: true,
  error: null,
  opened: {
    type: '',
    payload: null,
  },
};
export default createReducer(initialState, (builder) => {
  builder
    .addCase(REQUEST_START, (state, action) => {
      state.loading = true;
    })
    .addCase(REQUEST_FAILURE, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase(AUTH_FAILURE, (state, action) => {
      state.loading = false;
    })
    .addCase(SET_OPEN_WINDOW, (state, action) => {
      state.opened = action.payload;
    })
    .addCase(GET_CHAT_ROOMS_SUCCESS, (state, action) => {
      state.loading = false;
    })
    .addCase(RESET_APP_ERROR, (state, action) => {
      state.error = null;
    })
    .addCase(JOIN_CHAT_ROOM, (state, action) => {
      state.loading = false;
    })
    .addCase(LEAVE_CHAT_ROOM, (state, action) => {
      state.loading = false;
    })
    .addCase(APP_LOADED, (state, action) => {
      state.loading = false;
    })
    .addDefaultCase((state, action) => {});
});
