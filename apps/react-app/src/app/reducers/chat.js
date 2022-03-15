import {
  CHAT_OPENED,
  CHAT_CLOSED,
  GET_CHAT_ROOMS_SUCCESS,
  SET_CHATROOM_STATE,
  LOAD_CHATROOM_CONVERSATION,
  DM_SENT,
  DM_RECEIVED,
  RESET_DM_UNREAD_MESSAGES,
  CHATROOM_MESSAGE_SENT,
  CHATROOM_MESSAGE_RECEIVED,
  SET_DM_ACTIVE,
  SET_DM_INACTIVE,
  OPEN_DM,
  CLOSE_DM,
  CLOSE_ALL_DMS,
  LOAD_DM_CONVERSATION,
} from '../actions/types/chat';
import { VIEW_TYPE_POPPER } from '../types/dm';
import { createReducer } from '@reduxjs/toolkit';

const initialState = {
  activeDMs: [],
  publicRooms: null,
};

export default createReducer(initialState, (builder) => {
  builder
    .addCase(CHAT_OPENED, (state, action) => {
      state.publicRooms = state.publicRooms.map((room) => {
        if (room.id === action.payload.id) {
          room.state.url = action.payload.url;
          room.state.isActive = true;
          room.state.isOpened = true;
        } else {
          room.state.isOpened = false;
        }
        return room;
      });
    })
    .addCase(CHAT_CLOSED, (state, action) => {
      state.publicRooms = state.publicRooms.map((room) => {
        if (room.id === action.payload) {
          room.state = {
            url: null,
            isActive: false,
            isOpened: false,
            messages: [],
            isConversationLoaded: false,
          };
        }
        return room;
      });
    })
    .addCase(GET_CHAT_ROOMS_SUCCESS, (state, action) => {
      if (!state.publicRooms) state.publicRooms = action.payload;
    })
    .addCase(SET_CHATROOM_STATE, (state, action) => {
      state.publicRooms = state.publicRooms.map((room) => {
        if (room.id === action.payload.id) {
          room.state = { ...room.state, ...action.payload.state };
        }
        return room;
      });
    })
    .addCase(LOAD_CHATROOM_CONVERSATION, (state, action) => {
      state.publicRooms = state.publicRooms.map((room) => {
        console.log('IDs', room, action.payload);
        if (room.id === action.payload.id) {
          room.state.messages = action.payload.messages;
          room.state.isConversationLoaded = true;
        }
        return room;
      });
    })
    .addCase(DM_SENT, (state, action) => {
      state.activeDMs = state.activeDMs.map((dm) => {
        if (
          dm.id === action.payload.roomId &&
          !dm.state.messages.find((message) => message.id === action.payload.id)
        ) {
          dm.state.messages.push(action.payload);
        }
        return dm;
      });
    })
    .addCase(DM_RECEIVED, (state, action) => {
      if (!state.activeDMs.find((dm) => dm.id === action.payload.dm.id)) {
        state.activeDMs.push({
          ...action.payload.dm,
          state: {
            messages: [action.payload.message],
            unread: 1,
            isOpened: false,
            isConversationLoaded: true,
            viewType: VIEW_TYPE_POPPER,
          },
        });
      } else {
        state.activeDMs.map((dm) => {
          if (
            dm.id === action.payload.dm.id &&
            !dm.state.messages.find(
              (message) => message.id === action.payload.message.id
            )
          ) {
            dm.state.messages.push(action.payload.message);
            dm.state.unread = dm.state.unread + 1;
          }
          return dm;
        });
      }
    })
    .addCase(RESET_DM_UNREAD_MESSAGES, (state, action) => {
      state.activeDMs.map((dm) => {
        if (dm === action.payload) dm.state.unread = 0;
        return dm;
      });
    })
    .addCase(SET_DM_ACTIVE, (state, action) => {
      if (!state.activeDMs.find((dm) => dm.id === action.payload.id)) {
        state.activeDMs.push({
          ...action.payload,
          state: { ...action.payload.state, isOpened: true },
        });
      } else {
        state.activeDMs.map((dm) => {
          if (dm.id === action.payload.id) dm.state.isOpened = true;
          else dm.state.isOpened = false;
          return dm;
        });
      }
    })
    .addCase(SET_DM_INACTIVE, (state, action) => {
      state.activeDMs = state.activeDMs.filter((dm) => dm.id != action.payload);
    })
    .addCase(OPEN_DM, (state, action) => {
      state.activeDMs = state.activeDMs.map((dm) => {
        if (dm.id === action.payload) dm.state.isOpened = true;
        else dm.state.isOpened = false;
        return dm;
      });
    })
    .addCase(CLOSE_DM, (state, action) => {
      state.activeDMs = state.activeDMs.map((dm) => {
        if (dm.id === action.payload) dm.state.isOpened = false;
        return dm;
      });
    })
    .addCase(CLOSE_ALL_DMS, (state, action) => {
      state.activeDMs = state.activeDMs.map((dm) => {
        dm.state.isOpened = false;
        return dm;
      });
    })
    .addCase(LOAD_DM_CONVERSATION, (state, action) => {
      state.activeDMs = state.activeDMs.map((dm) => {
        if (dm.id === action.payload.id) {
          dm.state.messages = action.payload.messages;
          dm.state.isConversationLoaded = true;
        }
        return dm;
      });
    })
    .addMatcher(
      (action) =>
        action.type === CHATROOM_MESSAGE_SENT ||
        action.type === CHATROOM_MESSAGE_RECEIVED,
      (state, action) => {
        state.publicRooms = state.publicRooms.map((room) => {
          if (
            room.name === action.payload.to &&
            !room.state.messages.find(
              (message) => message.id === action.payload.id
            )
          ) {
            action.payload.time = JSON.stringify(action.payload.time);
            room.state.messages.push(action.payload);
          }
          return room;
        });
      }
    )
    .addDefaultCase((state, action) => {
      //
    });
});
