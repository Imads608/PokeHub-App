import PropTypes from 'prop-types';
import { MessagePropTypes } from './message';

export const ChatroomPropTypes = PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    description: PropTypes.string,
    id: PropTypes.number.isRequired,
    state: PropTypes.shape({
        url: PropTypes.shape({
            pathname: PropTypes.string.isRequired,
            search: PropTypes.string.isRequired
        }),
        messages: PropTypes.arrayOf(MessagePropTypes).isRequired,
        isConversationLoaded: PropTypes.bool.isRequired,
        isActive: PropTypes.bool.isRequired,
        isOpened: PropTypes.bool.isRequired
    })
})

// Websocket Notification Types received from Server
export const CHATROOM_MESSAGE = 'CHATROOM_MESSAGE';
export const TYPE_CHAT_CHATROOM = 'public-chatroom';
export const CHAT_ROOM = 'CHAT_ROOM';
export const CHAT_ROOM_DOESNT_EXIST = 'Chat Room doesn\'t exist.'