import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { setOpenWindow, requestFailure } from '../../../actions/app';
import { openedChatRoom } from '../../../actions/chat';
import { setErrorNotification } from '../../../actions/notification';
import { getChatRoomMembers } from '../../../api/chat';
import PropTypes from 'prop-types';
import Loading from '../../layout/Loading';
import { Redirect } from 'react-router';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import withWidth from '@material-ui/core/withWidth';
import ChatMobileHeader from './ChatMobileHeader';
import ChatHeader from './ChatHeader';
import Introduction from './Introduction';
import Rules from './Rules';
import Lobby from './Lobby';
import Members from './Members';
import { getCurrentOpenedWindow } from '../../../selectors/app';
import { getUser, isUserMemberOfCurrentChatRoom } from '../../../selectors/user';
import { getCurrentChatRoom, getActiveChatRooms } from '../../../selectors/chat';
import { getAppNotificationMessage } from '../../../selectors/notification';
import { ChatroomPropTypes, CHAT_ROOM_DOESNT_EXIST, TYPE_CHAT_CHATROOM } from '../../../types/chatroom';
import { UserPropTypes } from '../../../types/user';
import { OpenedWindowPropTypes, CHAT_ROOM } from '../../../types/app';
import '../chat.css';
import WithResultsSearch from '../../hoc/WithResultsSearch';
import useInitialLoad from '../../../hooks/useInitialLoad';

const ChatRoom = ({ setChatRoomOpen, openedChatRoom, setOpenWindow, user, isMember, activeChatRooms, currentRoom,
                    currentWindow, location, match, fetched, getResults, searchOnNewFilter, resetFilter, setErrorNotification, notificationMessage }) => {

    const navLinks = ['Rules', 'Lobby', 'Members'];
    const { data: chatrooms, error, isLoading } = useInitialLoad();


    useEffect(() => {
        chatrooms && (!currentWindow.payload || currentWindow.type !== CHAT_ROOM || currentWindow.payload && currentWindow.payload.id !== parseInt(match.params.id)) && setChatRoomOpen();
    }, [match.params, chatrooms]);


    /*getRoomMembers = (roomId) => {
        console.log('Room ID is', roomId);
        axios.get(`${appConfig.apiGateway}/chatrooms/${roomId}/members`, getAPIRequestHeader())
            .then((result) => this.setState({ members: result.data }))
            .catch(err => requestFailure(err));
    }*/

    setChatRoomOpen = () => {
        const currentChat = chatrooms.find(room => room.id === parseInt(match.params.id))
        if (currentChat) {
            openedChatRoom({ pathname: location.pathname, search: location.search }, currentChat.id);
            setOpenWindow({type: CHAT_ROOM, payload: { id: currentChat.id, name: currentChat.name }});
        } else setErrorNotification(CHAT_ROOM_DOESNT_EXIST, 'AlertNotification', null);
    }

    return (
        !isLoading && !currentRoom && notificationMessage === CHAT_ROOM_DOESNT_EXIST ? (
            <Redirect to='/dashboard' />
        ) : isLoading || currentWindow.type !== CHAT_ROOM ? (
            <Loading />
        ) : currentWindow.type === CHAT_ROOM && !currentRoom && activeChatRooms.length > 0 ? (
            <Redirect to={`/chatrooms/${activeChatRooms[0].id}`} />
        ) : currentWindow.type === CHAT_ROOM && !currentRoom && activeChatRooms.length === 0 ? (
            <Redirect to='/dashboard' />
        ) 
        : (
            <Grid container spacing={0}>
                <Hidden smDown>
                        <Grid item md={3}>
                            <ChatHeader roomName={currentRoom.name} location={location} />
                        </Grid>
                </Hidden>
                <Grid item xs={12} md={9}>
                    <div style={{display: 'flex', height: '93vh', flexDirection: 'column'}}>
                        <Hidden mdUp>
                            <ChatMobileHeader chatroom={currentRoom} navLinks={navLinks} location={location} />
                        </Hidden>
                        
                        { location.search === '?view=rules' && parseInt(match.params.id) === currentRoom.id ? <Rules location={location} room={currentRoom} /> 
                            : location.search === '?view=lobby' && parseInt(match.params.id) === currentWindow.payload.id ? 
                                <Lobby user={user} isMember={isMember} room={currentRoom} location={location} /> 
                            : location.search === '?view=members' && parseInt(match.params.id) === currentWindow.payload.id ? 
                                <Members location={location} user={user} fetched={fetched} roomId={currentRoom.id}
                                        getResults={getResults} resetFilter={resetFilter} searchOnNewFilter={searchOnNewFilter} 
                                />
                            : location.search === '' && parseInt(match.params.id) === currentWindow.payload.id ? 
                                <Introduction room={currentRoom} location={location} user={user} />
                            : ''
                        }
                    </div>
                </Grid>
            </Grid>
        )
    )
    
}

ChatRoom.propTypes = {
    user: UserPropTypes,
    isMember: PropTypes.bool.isRequired,
    currentWindow: OpenedWindowPropTypes.isRequired,
    currentRoom: ChatroomPropTypes,
    openedPublicRooms: PropTypes.arrayOf(ChatroomPropTypes),
    setOpenWindow: PropTypes.func.isRequired,
    activeChatRooms: PropTypes.arrayOf(ChatroomPropTypes).isRequired,
    notificationMessage: PropTypes.string
}

const mapStateToProps = (state) => ({
    user: getUser(state),
    isMember: isUserMemberOfCurrentChatRoom(state),
    currentWindow: getCurrentOpenedWindow(state),
    currentRoom: getCurrentChatRoom(state),
    activeChatRooms: getActiveChatRooms(state),
    notificationMessage: getAppNotificationMessage(state)
})

export default connect(mapStateToProps, { setOpenWindow, openedChatRoom, requestFailure, setErrorNotification })(withWidth()(WithResultsSearch(ChatRoom, getChatRoomMembers, null, TYPE_CHAT_CHATROOM)));