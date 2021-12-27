import { PaletteMode } from '@mui/material';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import { request_start, request_failure, auth_failure } from '../actions/common';
import { get_chatrooms_success } from './room';
import { join_chatroom, leave_chatroom } from './user';

export interface AppState {
    loading: boolean,
    error: any,
    opened: OpenedWindow | null,
    theme: PaletteMode
}

export interface OpenedWindow {
    type: WindowTypes,
    payload: ChatRoomPayload | null
}

export enum WindowTypes {
    NONE,
    CHAT_ROOM
}

export interface ChatRoomPayload {
    id: string
}

const appSlice = createSlice({
    name: 'app-state',
    initialState: { loading: false, error: null, opened: null, theme: 'light' } as AppState,
    reducers: {
        open_window: (state: AppState, action: PayloadAction<OpenedWindow>) => {
            state.opened = action.payload;
        },
        app_loaded: (state: AppState) => {
            state.loading = false;
        },
        toggle_theme: (state: AppState) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(HYDRATE, (state: AppState) => {
                console.log('HYDRATE');
                return { ...state }
            })
            .addCase(request_start, (state: AppState) => {
                state.loading = true;
            })
            .addCase(request_failure, (state: AppState, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(auth_failure, (state) => {
                state.loading = false;
            })
            .addCase(get_chatrooms_success, (state) => {
                state.loading = false;
            })
            .addCase(join_chatroom, (state) => {
                state.loading = false;
            })
            .addCase(leave_chatroom, (state) => {
                state.loading = false;
            })
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            .addDefaultCase((state, action) => { return state; })
    }
});

export const { open_window, app_loaded, toggle_theme } = appSlice.actions;
export default appSlice;