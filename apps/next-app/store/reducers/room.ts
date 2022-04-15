import { IChatRoom } from '@pokehub/chat/interfaces';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import { ParsedUrlQuery } from 'querystring';

export interface RoomState {
  publicRooms: PublicRoomData[] | null;
}

export interface PublicRoomData extends IChatRoom {
  state: InternalRoomState;
}

export interface InternalRoomState {
  currentTab: 'Lobby' | 'Members' | 'Rules';
  isActive: boolean;
  isOpened: boolean;
  messages: any[];
  isConversationLoaded: boolean;
}

export interface UrlPath {
  pathname: string;
  query: ParsedUrlQuery | null;
}

const roomSlice = createSlice({
  name: 'room-state',
  initialState: { publicRooms: [] } as RoomState,
  reducers: {
    get_chatrooms_success: ( state: RoomState, action: PayloadAction<IChatRoom[]> ) => {
      action.payload.forEach(room => state.publicRooms.push({ ...room, state: { currentTab: 'Lobby', isActive: false, isOpened: false, messages: [], isConversationLoaded: false } }));
    },
    open_chatroom: (
      state: RoomState,
      action: PayloadAction<{ id: string; }>
    ) => {
      state.publicRooms =
        state.publicRooms &&
        state.publicRooms.map((room) => {
          if (room.id === action.payload.id) {
            room.state.isActive = true;
            room.state.isOpened = true;
          } else {
            room.state.isOpened = false;
          }
          return room;
        });
    },
    close_chatroom: (state: RoomState, action: PayloadAction<string>) => {
      state.publicRooms =
        state.publicRooms &&
        state.publicRooms.map((room) => {
          if (room.id === action.payload) {
            room.state = {
              ...room.state,
              isActive: false,
              isOpened: false,
              messages: [],
              isConversationLoaded: false,
            };
          }
          return room;
        });
    },
    set_chatroom_state: (
      state: RoomState,
      action: PayloadAction<PublicRoomData>
    ) => {
      state.publicRooms =
        state.publicRooms &&
        state.publicRooms.map((room) => {
          if (room.id === action.payload.id) {
            room.state = { ...room.state, ...action.payload.state };
          }
          return room;
        });
    },
    load_chatroom_conversation: (
      state: RoomState,
      action: PayloadAction<{ id: string; messages: any[] }>
    ) => {
      state.publicRooms =
        state.publicRooms &&
        state.publicRooms.map((room) => {
          if (room.id === action.payload.id) {
            room.state.messages = action.payload.messages;
            room.state.isConversationLoaded = true;
          }
          return room;
        });
    },
    chatroom_message_sent: (
      state: RoomState,
      action: PayloadAction<{ to: string; id: string; time: string }>
    ) => {
      state.publicRooms =
        state.publicRooms &&
        state.publicRooms.map((room) => {
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
    },
    chatroom_mesage_received: (
      state: RoomState,
      action: PayloadAction<{ to: string; id: string; time: string }>
    ) => {
      state.publicRooms =
        state.publicRooms &&
        state.publicRooms.map((room) => {
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
    },
  },
  extraReducers: (builder) => {
    builder.addCase(HYDRATE, (state: RoomState, action: any) => {
      if (state.publicRooms.length > 0)
        return { ...state };
      else
        return { ...state,  ...action.payload['room-state'] };
    });
  },
});

export const {
  get_chatrooms_success,
  open_chatroom,
  close_chatroom,
  set_chatroom_state,
  load_chatroom_conversation,
  chatroom_mesage_received,
  chatroom_message_sent,
} = roomSlice.actions;
export default roomSlice;
