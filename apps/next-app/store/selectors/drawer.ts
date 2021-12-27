import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const mainDrawerToggle = (state: RootState) => state['drawer-state'].drawerToggle;
const chatRoomsToggle = (state: RootState) => state['drawer-state'].chatroomsToggle;
const directmessagesToggle = (state: RootState) => state['drawer-state'].dmsToggle;

export const getDrawerToggle = createSelector(
    [mainDrawerToggle], drawerToggle => drawerToggle
);

export const getChatRoomsToggle = createSelector(
    [chatRoomsToggle], chatroomsToggle => chatroomsToggle
);

export const getDMsToggle = createSelector(
    [directmessagesToggle], dmsToggle => dmsToggle
);