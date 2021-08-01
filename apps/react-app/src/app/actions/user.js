import { JOIN_CHAT_ROOM, LEAVE_CHAT_ROOM } from "./types/user"

export const joinedChatRoom = (joinedRooms) => {
    return {
        type: JOIN_CHAT_ROOM,
        payload: joinedRooms
    }
}

export const leftChatRoom = (joinedRooms) => {
    return {
        type: LEAVE_CHAT_ROOM,
        payload: joinedRooms
    }
}