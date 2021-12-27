import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUserPublicProfileWithToken } from '@pokehub/user';
//import { app_loaded } from './app';
import {
  auth_failure,
  login_success,
  logout,
  login_success_verification_needed,
} from '../actions/common';
import { HYDRATE } from 'next-redux-wrapper';
import { APIError } from '../../types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  error: APIError | null;
  loading: boolean;
}

const authSlice = createSlice({
  name: 'auth-state',
  initialState: {
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    error: null,
    loading: true,
  } as AuthState,
  reducers: {
    reset_auth_failure: (state: AuthState) => {
      state.loading = false;
      state.error = null;
    },
    auth_loaded: (state: AuthState) => {
      state.loading = false;
    },
    auth_loading: (state: AuthState) => {
      state.loading = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(HYDRATE, (state: AuthState) => {
        return { ...state };
      })
      /*.addCase(app_loaded, (state) => {
                state.loading = true;
            })*/
      .addCase(
        login_success,
        (
          state: AuthState,
          action: PayloadAction<IUserPublicProfileWithToken>
        ) => {
          state.loading = false;
          state.isAuthenticated = true;
          state.isEmailVerified = false;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
        }
      )
      .addCase(
        auth_failure,
        (state: AuthState, action: PayloadAction<APIError>) => {
          console.log('Action in auth_failure:', action);
          state.error = action.payload;
          state.loading = false;
        }
      )
      .addCase(logout, (state: AuthState) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
      })
      .addCase(login_success_verification_needed, (state: AuthState) => {
        state.loading = false;
        state.isEmailVerified = false;
      });
  },
});

export const { reset_auth_failure, auth_loaded, auth_loading } =
  authSlice.actions;
export default authSlice;
