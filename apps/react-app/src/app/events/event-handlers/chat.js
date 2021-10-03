import { CHATROOM_MESSAGE_RECEIVED, DM_RECEIVED } from '../../actions/types/chat';
import { TYPE_CHAT_DM } from '../../types/dm';
import { eventTypes } from '../../types/socket';

export const registerMessagesEventHandler = (socket) => (dispatch) => {
    socket.on(eventTypes.CHATROOM_MESSAGE, (msg) => {
        console.log('Got public chat room message', msg);
        if (socket.id !== msg.socketId) {
            return dispatch({
                type: CHATROOM_MESSAGE_RECEIVED,
                payload: msg
            });
        }
    });

    socket.on(eventTypes.DIRECT_MESSAGE, (msg) => {
        console.log('Got dm', msg);
        if (socket.id !== msg.socketId) {
            return dispatch({
                type: DM_RECEIVED,
                payload: { 
                    dm: { 
                        id: msg.roomId, 
                        type: TYPE_CHAT_DM, 
                        name: '', 
                        isActive: true, 
                        participants: msg.to 
                    }, 
                    message: msg
                }
            })
        }
    })
}