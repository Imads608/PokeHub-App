import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const activeMenuItem = (state: RootState) => state['drawer-state'].activeMenuItem;
const drawerWidth = (state: RootState) => state['drawer-state'].drawerWidth;
const menuItemsState = (state: RootState) => state['drawer-state'].menuItemsState;

export const getActiveMenuItem = createSelector([activeMenuItem], (menuItem) => menuItem);
export const getDrawerWidth = createSelector([drawerWidth], (drawerWidth) => drawerWidth | 0);
export const getMenuItemsState = createSelector([menuItemsState], (state) => state);
