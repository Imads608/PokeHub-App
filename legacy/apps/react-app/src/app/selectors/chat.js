import { createSelector } from '@reduxjs/toolkit';
import { getMemoCurrentOpenedWindow } from './app';

const allChatRooms = (state) => state.chat.publicRooms;
const activeChatrooms = (state) =>
  state.chat.publicRooms &&
  state.chat.publicRooms.filter((opened) => opened.state.isActive === true);
const openedChatroom = (state) =>
  state.chat.publicRooms &&
  state.chat.publicRooms.find((room) => room.state.isOpened === true);
const activeDirectMessages = (state) => state.chat.activeDMs;
//const getCurrentDM = state => state.chat.openedDM;

export const getAllChatRooms = createSelector(
  [allChatRooms],
  (publicRooms) => publicRooms
);

export const getActiveChatRooms = createSelector(
  [activeChatrooms],
  (activeChatRooms) => activeChatRooms
);

export const getCurrentChatRoom = createSelector(
  [openedChatroom],
  (openedChatRoom) => openedChatRoom
);

export const getActiveDMs = createSelector(
  [activeDirectMessages],
  (activeDMs) => activeDMs
);

export const getOpenedDM = createSelector([getActiveDMs], (activeDMs) => {
  const dm = activeDMs.find((activeDM) => activeDM.state.isOpened);
  if (dm) return dm;
  return null;
});

export const getOpenedDMRecipients = createSelector(
  [getOpenedDM],
  (currentDM) => currentDM && currentDM.participants.slice(1)
);

export const getUnreadDMs = createSelector([getActiveDMs], (activeDMs) =>
  activeDMs.map((dm) => ({ id: dm.id, unread: dm.state.unread }))
);

export const getTotalUnreadDMs = createSelector([getActiveDMs], (activeDMs) => {
  let count = 0;
  activeDMs.forEach((dm) => {
    count = dm.state.unread + count;
  });
  return count;
});
