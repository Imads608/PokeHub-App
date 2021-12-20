import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUserPublicProfileWithToken } from '@pokehub/user';
//import { app_loaded } from './app';
import { auth_failure, login_success, logout } from '../actions/common';
import { HYDRATE } from 'next-redux-wrapper';
import { APIError } from '../../types/api';

interface AuthState {
    accessToken?: string,
    refreshToken?: string,
    isAuthenticated: boolean,
    error?: APIError,
    loading: boolean
}

const authSlice = createSlice({
    name: 'auth-state',
    initialState: { accessToken: null, refreshToken: null, isAuthenticated: false, error: null, loading: true } as AuthState,
    reducers: {
        /*login_success: (state: AuthState, action: PayloadAction<UserDetails>) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
        },
        logout: (state: AuthState) => {
            state.loading = false;
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
        },*/
        reset_auth_failure: (state: AuthState) => {
            state.loading = false;
        },
        auth_loaded: (state: AuthState) => {
            state.loading = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(HYDRATE, (state: AuthState) => {
                return { ...state }
            })
            /*.addCase(app_loaded, (state) => {
                state.loading = true;
            })*/
            .addCase(login_success, (state: AuthState, action: PayloadAction<IUserPublicProfileWithToken>) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.accessToken = action.payload.accessToken;
                state.refreshToken = action.payload.refreshToken;
            })
            .addCase(auth_failure, (state: AuthState, action: PayloadAction<APIError>) => {
                console.log('Action in auth_failure:', action);
                state.error = action.payload;
                state.loading = false;
            })
            .addCase(logout, (state: AuthState) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.accessToken = null;
                state.refreshToken = null;
            })
    }
});

export const { reset_auth_failure, auth_loaded } = authSlice.actions;
export default authSlice;