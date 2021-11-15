import React, { useDebugValue, useEffect } from 'react';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { joinChatRoom, leaveChatRoom } from '../../../middleware-thunks/chat';
import { UserPropTypes } from '../../../types/user';
import { ChatroomPropTypes } from '../../../types/chatroom';
import { setChatRoomState } from '../../../actions/chat';
import { connect } from 'react-redux';
import '../chat.css';

const Introduction = ({ room, location, user, joinChatRoom, leaveChatRoom, setChatRoomState }) => {
    useEffect(() => {
        setChatRoomState({ url: {pathname: location.pathname, search: location.search } }, room.id);
    }, []);

    return (
        <div className='theme-text-whitebkg intro-window main-window'>
            <div className='title-format header'>
                {`Welcome to # ${room.name}`}
            </div>
            <div className='theme-text-whitebkg'>
                {room.description}
            </div>
            <div style={{marginTop: '10px', display: 'flex', justifyContent: 'space-evenly'}}>
                <Button 
                    style={{marginRight: '20px', fontFamily: 'Orbitron' }}
                    color='secondary' 
                    component={Link} 
                    to={`${location.pathname}/?view=rules`} 
                    variant="contained">
                    View Rules
                </Button>

                {user.joinedRooms.find(publicRoom => publicRoom.id === room.id) ?
                    <Button style={{ fontFamily: 'Orbitron' }} onClick={() => leaveChatRoom(room.id, user.uid)} color='secondary' variant="contained">Leave Room</Button> :
                    <Button style={{ fontFamily: 'Orbitron' }} onClick={() => joinChatRoom(room.id, user.uid)} color='secondary' variant="contained">+ Join Room</Button>
                }
            </div>
        </div>
    )
}

Introduction.propTypes = {
    room: ChatroomPropTypes.isRequired,
    location: PropTypes.object.isRequired,
    user: UserPropTypes.isRequired,
    joinChatRoom: PropTypes.func.isRequired,
    leaveChatRoom: PropTypes.func.isRequired,
    setChatRoomState: PropTypes.func.isRequired
}


export default connect(null, { joinChatRoom, leaveChatRoom, setChatRoomState })(Introduction);