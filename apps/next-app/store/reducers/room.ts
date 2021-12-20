import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';

export interface RoomState {
    publicRooms?: PublicRoomData[]
}

export interface PublicRoomData {
    state?: InternalRoomState,
    id: string,
    name: string
}

export interface InternalRoomState {
    url: string,
    isActive: boolean,
    isOpened: boolean,
    messages?: any[],
    isConversationLoaded: boolean
}

const roomSlice = createSlice({
    name: 'room-state',
    initialState: { publicRooms: [] } as RoomState,
    reducers: {
        get_chatrooms_success: (state: RoomState, action: PayloadAction<PublicRoomData[]>) => {
            state.publicRooms = action.payload;
        },
        chat_opened: (state: RoomState, action: PayloadAction<{ id: string, url: string }>) => {
            state.publicRooms = state.publicRooms?.map(room => {
                if (room.id === action.payload.id) {
                    room.state.url = action.payload.url;
                    room.state.isActive = true;
                    room.state.isOpened = true;
                } else {
                    room.state.isOpened = false;
                }
                return room;
            })
        },
        chat_closed: (state: RoomState, action: PayloadAction<string>) => {
            state.publicRooms = state.publicRooms.map(room => {
                if (room.id === action.payload) {
                    room.state = { url: null, isActive: false, isOpened: false, messages: [], isConversationLoaded: false }; 
                }
                return room;
            })
        },
        set_chatroom_state: (state: RoomState, action: PayloadAction<PublicRoomData> ) => {
            state.publicRooms = state.publicRooms.map(room => {
                if (room.id === action.payload.id) {
                    room.state = {...room.state, ...action.payload.state };
                }
                return room;
            })
        },
        load_chatroom_conversation: (state: RoomState, action: PayloadAction<{ id: string, messages: any[] }>) => {
            state.publicRooms = state.publicRooms.map(room => {
                if (room.id === action.payload.id) {
                    room.state.messages = action.payload.messages;
                    room.state.isConversationLoaded = true;
                }
                return room;
            })
        },
        chatroom_message_sent: (state: RoomState, action: PayloadAction<{ to: string, id: string, time: string }>) => {
            state.publicRooms = state.publicRooms.map(room => {
                if (room.name === action.payload.to && !room.state.messages.find(message => message.id === action.payload.id)) {
                    action.payload.time = JSON.stringify(action.payload.time);
                    room.state.messages.push(action.payload);
                }
                return room;
            });
        },
        chatroom_mesage_received: (state: RoomState, action: PayloadAction<{ to: string, id: string, time: string }>) => {
            state.publicRooms = state.publicRooms.map(room => {
                if (room.name === action.payload.to && !room.state.messages.find(message => message.id === action.payload.id)) {
                    action.payload.time = JSON.stringify(action.payload.time);
                    room.state.messages.push(action.payload);
                }
                return room;
            });
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(HYDRATE, (state: RoomState) => {
                return { ...state }
            })
    }
});

export const { get_chatrooms_success, chat_opened, chat_closed, set_chatroom_state, load_chatroom_conversation, chatroom_mesage_received, chatroom_message_sent } = roomSlice.actions;
export default roomSlice;