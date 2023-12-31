import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
//import { authMiddleware } from './middleware/auth';
import { connectWebSocketMiddleware } from './socket/socket.middleware';
import appSlice from './app/app.reducer';
import authSlice from './auth/auth.reducer';
import drawerSlice from './drawer/drawer.reducer';
import roomSlice from './room/room.reducer';
import userSlice from './user/user.reducer';

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
      getDefaultMiddleware({ serializableCheck: false }).concat(/*authMiddleware, */connectWebSocketMiddleware),
  });

export type RootStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<RootStore['getState']>;
export const wrapper = createWrapper<RootStore>(makeStore, { debug: true });
