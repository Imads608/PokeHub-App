import {
  AUTH_FAILURE,
  AUTH_LOADED,
  LOGIN_SUCCESS,
  LOGOUT,
  RESET_AUTH_FAILURE,
} from '../actions/types/auth';
import { APP_LOADED } from '../actions/types/app';
import { createReducer } from '@reduxjs/toolkit';

const initialState = {
  token: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  error: null,
  loading: true,
};

export default createReducer(initialState, (builder) => {
  builder
    .addCase(APP_LOADED, (state, action) => {
      state.loading = true;
    })
    .addCase(LOGIN_SUCCESS, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    })
    .addCase(LOGOUT, (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
    })
    .addCase(AUTH_FAILURE, (state, action) => {
      state.error = action.payload;
      state.loading = false;
    })
    .addMatcher(
      (action) =>
        action.type === RESET_AUTH_FAILURE || action.type === AUTH_LOADED,
      (state, action) => {
        state.loading = false;
      }
    )
    .addDefaultCase((state, action) => {});
});
