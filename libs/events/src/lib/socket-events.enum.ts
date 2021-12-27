/*export enum SocketEvents {
    CLIENT_DETAILS = 'client-details',
    CHATROOM_MESSAGE = 'chatroom-message',
    USER_NOTIFICATION = 'user-notification',
    DIRECT_MESSAGE = 'direct-message',
    USER_IS_TYPING = 'user-is-typing',
    USER_STOPPED_TYPING = 'user-stopped-typing',
    JOIN_DMs = 'join-direct-message-conversation',
    USER_PING = 'user-ping',
    USER_AVAILABLE = 'user-available',
    USER_AWAY = 'user-away',
    RECEIVE_USER_NOTIFICATIONS = 'receive-user-notifications',
    STOP_USER_NOTIFICATIONS = 'stop-user-notifications'
}
*/

export enum SocketEvents {
  CLIENT_DETAILS = 'user.details',
}

export enum SocketUserEvents {
  CLIENT_DETAILS = 'user.details',
  USER_NOTIFICATIONS = 'user.notifications',
  USER_TYPING = 'user.notifications.typing',
  USER_STATUS = 'user.notification.status',
}

export enum SocketChatRoomEvents {
  CHATROOM_MESSAGE = 'chatroom.message',
}

export enum SocketDMEvents {
  DIRECT_MESSAGE_PRIVATE = 'dm.private',
  DIRECT_MESSAGE_GROUP = 'dm.group',
}
