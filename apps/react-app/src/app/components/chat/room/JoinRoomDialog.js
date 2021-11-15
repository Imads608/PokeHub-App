import React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { Button } from '@mui/material';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { joinChatRoom } from '../../../middleware-thunks/chat'
import { UserPropTypes } from '../../../types/user';
import { ChatroomPropTypes } from '../../../types/chatroom';
import '../chat.css';

const JoinRoomDialog = ({ open, location, user, room, joinChatRoom }) => {
     return (
        <div>
            <Dialog aria-labelledby="simple-dialog-title" open={open}>
                <div style={{ backgroundColor: 'pink', padding: '10px' }}>
                    <DialogTitle id="simple-dialog-title">
                        <div className='theme-text'>
                            You're not a member
                        </div>
                    </DialogTitle>
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                        <Button style={{ fontFamily: 'Orbitron' }} component= { Link } 
                            to={{ 
                                pathname: location.state && location.state.from ? location.state.from.pathname : location.pathname, 
                                search: location.state && location.state.from ? location.state.from.search : '' 
                            }} 
                            variant="contained">Close</Button>
                        <Button style={{ fontFamily: 'Orbitron' }} onClick={() => joinChatRoom(room.id, user.uid)} variant="contained">Join Room</Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

JoinRoomDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    user: UserPropTypes.isRequired,
    room: ChatroomPropTypes.isRequired,
    joinChatRoom: PropTypes.func.isRequired
}


export default connect(null, { joinChatRoom })(withRouter(JoinRoomDialog));