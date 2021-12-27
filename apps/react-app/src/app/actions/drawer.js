import {
  OPEN_DRAWER,
  CLOSE_DRAWER,
  OPEN_CHATROOMS_MENU,
  CLOSE_CHATROOMS_MENU,
  OPEN_DMS,
  CLOSE_DMS,
} from './types/drawer';

export const openedDrawer = () => {
  return {
    type: OPEN_DRAWER,
    payload: null,
  };
};

export const closedDrawer = () => {
  return {
    type: CLOSE_DRAWER,
    payload: null,
  };
};

export const openedChatRoomsMenu = () => {
  return {
    type: OPEN_CHATROOMS_MENU,
    payload: null,
  };
};

export const closedChatRoomsMenu = () => {
  return {
    type: CLOSE_CHATROOMS_MENU,
    payload: null,
  };
};

export const openedDMs = () => {
  return {
    type: OPEN_DMS,
    payload: null,
  };
};

export const closedDMs = () => {
  return {
    type: CLOSE_DMS,
    payload: null,
  };
};
