import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { authMiddleware } from './middleware/auth';
import appSlice from './reducers/app';
import authSlice from './reducers/auth';
import drawerSlice from './reducers/drawer';
import roomSlice from './reducers/room';
import userSlice from './reducers/user';

const makeStore = () =>
  configureStore({
    reducer: {
      [authSlice.name]: authSlice.reducer,
      [appSlice.name]: appSlice.reducer,
      [roomSlice.name]: roomSlice.reducer,
      [userSlice.name]: userSlice.reducer,
      [drawerSlice.name]: drawerSlice.reducer,
    },
    devTools: true,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(authMiddleware),
  });

export type RootStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<RootStore['getState']>;
export const wrapper = createWrapper<RootStore>(makeStore, { debug: true });
