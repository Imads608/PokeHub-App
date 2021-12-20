import {configureStore } from '@reduxjs/toolkit';
import {createWrapper } from 'next-redux-wrapper';
import appSlice from './reducers/app';
import authSlice from './reducers/auth';
import roomSlice from './reducers/room';
import userSlice from './reducers/user';

const makeStore = () =>
    configureStore({
        reducer: {
            [authSlice.name]: authSlice.reducer,
            [appSlice.name]: appSlice.reducer,
            [roomSlice.name]: roomSlice.reducer,
            [userSlice.name]: userSlice.reducer
        },
        devTools: true,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false })
    });

export type RootStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<RootStore['getState']>;
export const wrapper = createWrapper<RootStore>(makeStore, { debug: true });
