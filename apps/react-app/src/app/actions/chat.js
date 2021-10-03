import { CHAT_OPENED, CHAT_CLOSED, GET_CHAT_ROOMS_SUCCESS, CHATROOM_MESSAGE_SENT, CHATROOM_MESSAGE_RECEIVED, SET_CHATROOM_STATE,
         SET_DM_ACTIVE, SET_DM_INACTIVE, LOAD_DM_CONVERSATION, LOAD_CHATROOM_CONVERSATION, OPEN_DM, CLOSE_DM, DM_SENT, 
         RESET_DM_UNREAD_MESSAGES, CLOSE_ALL_DMS, DM_RECEIVED } from './types/chat';
import { CHATROOM_MESSAGE, DIRECT_MESSAGE } from '../types/socket';
import { TYPE_CHAT_DM } from '../types/dm';

//import { socket } from '../userSocket';

export const openedChatRoom = (url, roomId) => {
    return {
        type: CHAT_OPENED,
        payload: { id: roomId, url}
    }
}

export const closedChatRoom = (opened) => {
    return {
        type: CHAT_CLOSED,
        payload: opened
    }
}

export const fetchedChatRooms = (rooms) => {
    return {
        type: GET_CHAT_ROOMS_SUCCESS,
        payload: rooms
    }
}

export const sentMessageToChatRoom = (message) => {
    return {
        type: CHATROOM_MESSAGE_SENT,//PUBLIC_CHATROOM_MESSAGE_SENT,
        payload: message
    }
}

export const receivedChatRoomMessage = (message) => {
    return {
        type: CHATROOM_MESSAGE_RECEIVED,
        payload: message
    }
}

export const setChatRoomState = (state, roomId) => {
    return {
        type: SET_CHATROOM_STATE,
        payload: {state, id: roomId}
    }
}

export const setDMActive = (conversation) => {
    return {
        type: SET_DM_ACTIVE,
        payload: conversation
    }
}

export const loadDMConversation = (conversation) => {
    return {
        type: LOAD_DM_CONVERSATION,
        payload: conversation
    }
}

export const loadChatroomConversation = (conversation) => {
    return {
        type: LOAD_CHATROOM_CONVERSATION,
        payload: conversation
    }
}

export const setDMInactive = (dmId) => {
    return {
        type: SET_DM_INACTIVE,
        payload: dmId
    }
}

export const openedDM = (roomId) => {
    return {
        type: OPEN_DM,
        payload: roomId
    }
}

export const closedDM = (roomId) => {
    return {
        type: CLOSE_DM,
        payload: roomId
    }
}

export const sentDM = (message) => {
    return {
        type: DM_SENT,
        payload: message
    }
}

export const resetDMUnreadMessages = (dmId) => {
    return {
        type: RESET_DM_UNREAD_MESSAGES,
        payload: dmId
    }
}

export const closedAllDMs = () => {
    return {
        type: CLOSE_ALL_DMS,
        payload: null
    }
}