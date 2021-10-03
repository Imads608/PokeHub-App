export const getUserStatusEvent = (userUid, pingTime, isAway) => {
    return {
        userUid,
        pingTime,
        isAway
    }
}

export const getUserNotificationEvent = (subscribedUserUid, receiveToggle) => {
    return {
        subscribedUserUid,
        receiveToggle
    }
}

export const getUserClientConnectedEvent = ({ uid, username, socketClient }, { publicRooms, privateRooms }) => {
    return {
        uid,
        username,
        socketClient,
        publicRooms,
        privateRooms
    }
}