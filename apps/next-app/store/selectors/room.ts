import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const allChatRooms = (state: RootState) => state['room-state'].publicRooms;
const activeChatrooms = (state: RootState) => state['room-state'].publicRooms && state['room-state'].publicRooms.filter(room => room.state.isActive === true)
const openedChatroom = (state: RootState) => state['room-state'].publicRooms && state['room-state'].publicRooms.find(room => room.state.isOpened === true)

export const getAllChatRooms = createSelector(
    [allChatRooms], publicRooms => publicRooms
);

export const getActiveChatRooms = createSelector(
    [activeChatrooms], activeChatRooms => activeChatRooms
);

export const getCurrentChatRoom = createSelector(
    [openedChatroom], openedChatRoom => openedChatRoom
);
