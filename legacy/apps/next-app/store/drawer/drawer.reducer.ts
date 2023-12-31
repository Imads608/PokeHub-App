import { createSlice, PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';

export type NavigationMenuItems = 'Battle' | 'Teams' | 'Chatrooms' | 'DMs' | 'Dex';

export type NavigationMenuState = {
  [key in NavigationMenuItems]: {
    [field: string]: string;
  };
}; 

export interface DrawerState {
  menuItemsState: NavigationMenuState;
  activeMenuItem?: NavigationMenuItems;
  drawerWidth?: number;
}

const drawerSlice = createSlice<DrawerState, SliceCaseReducers<DrawerState>, 'drawer-state'>({
  name: 'drawer-state',
  initialState: {
    menuItemsState: {
      Battle: {},
      Chatrooms: {},
      DMs: {},
      Teams: {},
      Dex: {}
    }
  },
  reducers: {
    menu_item_opened: (state: DrawerState, action: PayloadAction<NavigationMenuItems>) => {
      state.activeMenuItem = action.payload;
    },
    menu_item_closed: (state: DrawerState) => {
      state.activeMenuItem = undefined;
    },
    drawer_width_updated: (state: DrawerState, action: PayloadAction<number>) => {
      state.drawerWidth = action.payload;
    }
  },
  extraReducers: {
    [HYDRATE]: (state: DrawerState, action: PayloadAction<{'drawer-state': DrawerState }>) => {
      return {
        ...state,
        ...action.payload['drawer-state'],
      };
    },
  },
});

export const { 
  menu_item_closed,
  menu_item_opened,
  drawer_width_updated
} = drawerSlice.actions;

export default drawerSlice;
