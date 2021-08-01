import React, { useEffect } from 'react';
import ChatWindow from '../../common/ChatWindow';
import ChatInput from '../../common/ChatInput';
import JoinRoomDialog from './JoinRoomDialog';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setChatRoomState, sentMessageToChatRoom } from '../../../actions/chat';
import { loadChatRoomConversation } from '../../../middleware-thunks/chat';
import { ChatroomPropTypes, TYPE_CHAT_CHATROOM } from '../../../types/chatroom';
import { UserPropTypes } from '../../../types/user';
import { OpenedWindowPropTypes } from '../../../types/app';
import WithConversation from '../../hoc/WithConversation';
import '../chat.css';

const Lobby = ({ isMember, user, room, setChatRoomState, location, sentMessageToChatRoom, error, reloadConversation, loading }) => {
    
    useEffect(() => {
        room.state.url.pathname !== location.pathname || room.state.url.search !== location.search && setChatRoomState({ url: { pathname: location.pathname, search: location.search } }, room.id);
    }, [isMember]);

    return (
        <div className='chat-section'>
            <ChatWindow chatState={room.state} loading={loading} error={error} reload={reloadConversation} />
            <ChatInput 
                recipient={room} 
                sentMessageToRecipient={sentMessageToChatRoom} 
                typeChat={TYPE_CHAT_CHATROOM} 
                disabled={error || loading} 
            />
            {user && !isMember && <JoinRoomDialog user={user} room={room} open={true} />}
        </div>
    
    )
}

Lobby.propTypes = {
    user: UserPropTypes.isRequired,
    isMember: PropTypes.bool.isRequired,
    currentWindow: OpenedWindowPropTypes.isRequired,
    room: ChatroomPropTypes.isRequired,
    location: PropTypes.object.isRequired,
    setChatRoomState: PropTypes.func.isRequired,
    error: PropTypes.bool.isRequired,
    reloadConversation: PropTypes.func.isRequired, 
    loading: PropTypes.bool.isRequired
}

export default connect(null, { setChatRoomState, sentMessageToChatRoom, loadChatRoomConversation })(WithConversation(Lobby, TYPE_CHAT_CHATROOM));