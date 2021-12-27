import {
  OPEN_DRAWER,
  CLOSE_DRAWER,
  OPEN_CHATROOMS_MENU,
  CLOSE_CHATROOMS_MENU,
  OPEN_DMS,
  CLOSE_DMS,
} from '../actions/types/drawer';
import { LOGOUT } from '../actions/types/auth';
import { createReducer } from '@reduxjs/toolkit';

const initialState = {
  drawerToggle: false,
  chatroomsToggle: false,
  dmsToggle: false,
};

export default createReducer(initialState, (builder) => {
  builder
    .addCase(OPEN_DRAWER, (state, action) => {
      state.drawerToggle = true;
    })
    .addCase(CLOSE_DRAWER, (state, action) => {
      state.drawerToggle = false;
    })
    .addCase(LOGOUT, (state, action) => {
      state.drawerToggle = false;
    })
    .addCase(OPEN_CHATROOMS_MENU, (state, action) => {
      state.chatroomsToggle = true;
    })
    .addCase(CLOSE_CHATROOMS_MENU, (state, action) => {
      state.chatroomsToggle = false;
    })
    .addCase(OPEN_DMS, (state, action) => {
      state.dmsToggle = true;
    })
    .addCase(CLOSE_DMS, (state, action) => {
      state.dmsToggle = false;
    })
    .addDefaultCase((state, action) => {});
});
