import { createSelector } from '@reduxjs/toolkit';

const mainDrawerToggle = (state) => state.drawer.drawerToggle;
const chatRoomsToggle = (state) => state.drawer.chatroomsToggle;
const directmessagesToggle = (state) => state.drawer.dmsToggle;

export const getDrawerToggle = createSelector(
  [mainDrawerToggle],
  (drawerToggle) => drawerToggle
);

export const getChatRoomsToggle = createSelector(
  [chatRoomsToggle],
  (chatroomsToggle) => chatroomsToggle
);

export const getDMsToggle = createSelector(
  [directmessagesToggle],
  (dmsToggle) => dmsToggle
);
