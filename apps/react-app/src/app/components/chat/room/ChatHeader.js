import React from 'react';
import ChatRoomImage from '../../../img/chat-image.png';
import { List, ListItemIcon, ListItemText, ListItem } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import PeopleIcon from '@mui/icons-material/People';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import '../chat.css';


const ChatHeader = ({ roomName, location }) => {
    return (
        <div className='chat-sidebar'>
            <img src={ChatRoomImage} />
            <h3 className='chat-sidebar-header'>
                <span>  
                    <Link style={{textDecoration: 'none', color: 'white'}} to={location.pathname}># {roomName}</Link>
                </span>
            </h3>
            <List>
                    <ListItem 
                        button 
                        component={Link} to={{ pathname: location.pathname, search: `?view=rules` }} 
                        selected={location.search === '?view=rules'} 
                        style={{paddingBottom: 0, paddingTop: 0}}>
                        <ListItemIcon>
                            <AssignmentLateIcon fontSize='large' style={{color: 'white'}} />    
                        </ListItemIcon>
                        <ListItemText primary={
                            <h4 className='theme-text'>Rules</h4>} />
                    </ListItem>
                    <ListItem 
                        button 
                        component={Link} to={{ pathname: location.pathname, search: `?view=lobby`, state: { from: location } }} 
                        selected={location.search === '?view=lobby'} 
                        style={{paddingBottom: 0, paddingTop: 0}}>
                        <ListItemIcon>
                            <ChatIcon fontSize='large' style={{color: 'white'}}/>
                        </ListItemIcon>
                        <ListItemText primary={
                            <h4 className='theme-text'>Lobby</h4>} />
                    </ListItem>
                    <ListItem 
                        button 
                        component={Link} to={{ pathname: location.pathname, search: `?view=members`}} 
                        selected={location.search === '?view=members'} 
                        style={{paddingBottom: 0, paddingTop: 0}}>
                        <ListItemIcon>
                            <PeopleIcon fontSize='large' style={{color: 'white'}}/>
                        </ListItemIcon>
                        <ListItemText primary={
                            <h4 className='theme-text'>Members</h4>} />
                    </ListItem>
                </List>
        </div>
    )
}

ChatHeader.propTypes = {
    roomName: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired
}

export default ChatHeader;

