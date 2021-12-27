import { createSlice } from '@reduxjs/toolkit';
import { logout } from '../actions/common';
import { HYDRATE } from 'next-redux-wrapper';

interface DrawerState {
  drawerToggle: boolean;
  chatroomsToggle: boolean;
  dmsToggle: boolean;
}

const drawerSlice = createSlice({
  name: 'drawer-state',
  initialState: {
    drawerToggle: false,
    chatroomsToggle: false,
    dmsToggle: false,
  } as DrawerState,
  reducers: {
    drawer_opened: (state: DrawerState) => {
      console.log('Here in drawer state');
      state.drawerToggle = true;
    },
    drawer_closed: (state: DrawerState) => {
      state.drawerToggle = false;
    },
    chatrooms_opened: (state: DrawerState) => {
      state.chatroomsToggle = true;
    },
    chatrooms_closed: (state: DrawerState) => {
      state.chatroomsToggle = false;
    },
    dms_opened: (state: DrawerState) => {
      state.dmsToggle = true;
    },
    dms_closed: (state: DrawerState) => {
      state.dmsToggle = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(HYDRATE, (state: DrawerState) => {
        return { ...state };
      })
      .addCase(logout, (state: DrawerState) => {
        state.drawerToggle = false;
      });
  },
});

export const {
  drawer_closed,
  drawer_opened,
  chatrooms_closed,
  chatrooms_opened,
  dms_closed,
  dms_opened,
} = drawerSlice.actions;
export default drawerSlice;
