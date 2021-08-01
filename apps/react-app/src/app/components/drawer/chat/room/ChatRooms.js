import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { closedChatRoom, openedChatRoom } from '../../../../actions/chat';
import ChatIcon from '@material-ui/icons/Chat';
import { List, ListItemText, ListItem, MenuItem, Menu } from '@material-ui/core';

import { makeStyles, useTheme } from '@material-ui/core/styles';
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import AccordionDetails from '@material-ui/core/AccordionDetails';
import { Accordion, AccordionSummary } from '../../../custom/Accordion';
import CancelIcon from '@material-ui/icons/Cancel';
import { Link } from 'react-router-dom';
import AddIcon from '@material-ui/icons/Add';
import { getCurrentOpenedWindow } from '../../../../selectors/app';
import { getAllChatRooms, getActiveChatRooms } from '../../../../selectors/chat';
import { openedChatRoomsMenu, closedChatRoomsMenu } from '../../../../actions/drawer';
import { getChatRoomsToggle } from '../../../../selectors/drawer';
import { ChatroomPropTypes } from '../../../../types/chatroom';
import { OpenedWindowPropTypes, CHAT_ROOM } from '../../../../types/app';
import '../../drawer.css';

const useStyles = makeStyles({
    headerBlock: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    closeIcon: {
        color: 'rgb(171, 2, 64)',
        marginRight: '5px',
        cursor: 'pointer',
        '&:hover': {
            color: 'red'
        }
    }
});


const ChatRooms = ({ chatrooms, activeChatRooms, currentWindow, openedChatRoom, closedChatRoom, openedChatRoomsMenu, closedChatRoomsMenu, chatroomsMenuToggle }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [expand, setExpand] = React.useState(false);
    const classes = useStyles();
    const theme = useTheme();
    
    const openMenu = (event) => {
        setAnchorEl(event.currentTarget);
    }

    const toggleChatRoomsExpand = () => {
        if (!chatroomsMenuToggle) {
            openedChatRoomsMenu();
        } else {
            closedChatRoomsMenu();
        }
        setExpand(!expand);
    }

    const closeMenu = (e) => {
        e.stopPropagation();
        setAnchorEl(null);
    }

    const openChatRoom = (e, room) => {
        e.stopPropagation();
        //openedChatRoom({ pathname: `/chatrooms/${room._id}`, search: '' }, room);
        setAnchorEl(null);
    }

    const closeChat = (opened) => {
        closedChatRoom(opened);
    }

    return (
        <React.Fragment>
            <Accordion expanded={chatroomsMenuToggle} onChange={() => toggleChatRoomsExpand()}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <List className={classes.headerBlock}>
                        <ChatIcon fontSize='large' className={`drawer-icon ${chatroomsMenuToggle ? 'drawer-header-expanded' : 'drawer-header'}`} />
                        <ListItemText primary={<h4 className={`drawer-header-text ${chatroomsMenuToggle ? 'drawer-header-expanded' : 'drawer-header'}`}>Chat Rooms</h4>} />
                    </List>
                </AccordionSummary>
                <AccordionDetails className='drawer-accordion-details'>
                    <List className='drawer-expanded-list'>
                        {activeChatRooms && activeChatRooms.map((opened) => (
                            <ListItem 
                                button
                                component={Link}
                                to={{ pathname: opened.state.url.pathname, search: opened.state.url.search }}
                                selected={currentWindow.type === CHAT_ROOM && currentWindow.payload && currentWindow.payload.id === opened.id}
                                key={opened.id}
                                className='drawer-expanded-list-item'>
                                {currentWindow.type === CHAT_ROOM && currentWindow.payload && currentWindow.payload.id === opened.id && 
                                <CancelIcon fontSize="small" className={classes.closeIcon} onClick={() => closeChat(opened.id)} />}
                                <ListItemText 
                                    primary={
                                        <h5 
                                        className={`drawer-header-text drawer-expanded-list-item-text 
                                        ${currentWindow.type === CHAT_ROOM && currentWindow.payload && currentWindow.payload.id === opened.id ? 
                                        'drawer-header-expanded' : 'drawer-header'}`}
                                        ># {opened.name}</h5>} 
                                />
                            </ListItem>
                        ))}
                        <ListItem 
                            button
                            disabled={activeChatRooms && activeChatRooms.length === chatrooms.length ? true : false}
                            onClick={openMenu}
                            className='drawer-expanded-list-item'>
                            <AddIcon fontSize='small' />
                            <ListItemText 
                                primary={
                                    <h5 
                                    className={`drawer-header-text drawer-expanded-list-item-text drawer-header`}
                                    >Open New Chat Room</h5>} 
                            />
                            <Menu
                                id="simple-menu"
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={closeMenu}
                            >
                                {chatrooms && chatrooms.map((room, id) => (
                                    !activeChatRooms.find(opened => opened.id === room.id) &&
                                    <MenuItem component={Link} to={`/chatrooms/${room.id}`} className='drawer-header' key={id} onClick={closeMenu}># {room.name}</MenuItem>
                                ))}
                            </Menu>
                        </ListItem>
                        <ListItem 
                            button
                            component={Link}
                            to={`/chatrooms`}
                            className='drawer-expanded-list-item'>
                            <ListItemText 
                                primary={
                                    <h5 
                                    className={`drawer-header-text drawer-expanded-list-item-text drawer-header`}
                                    >View All Chat Rooms</h5>} 
                            />
                        </ListItem>
                    </List>
                </AccordionDetails>
            </Accordion>
        </React.Fragment>
    )
}

ChatRooms.propTypes = {
    chatrooms: PropTypes.arrayOf(ChatroomPropTypes).isRequired,
    activeChatRooms: PropTypes.arrayOf(ChatroomPropTypes).isRequired,
    currentWindow: OpenedWindowPropTypes.isRequired,
    closedChatRoom: PropTypes.func.isRequired,
    openedChatRoom: PropTypes.func.isRequired,
    chatroomsMenuToggle: PropTypes.bool.isRequired,
    openedChatRoomsMenu: PropTypes.func.isRequired,
    closedChatRoomsMenu: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
    chatrooms: getAllChatRooms(state),
    activeChatRooms: getActiveChatRooms(state),
    currentWindow: getCurrentOpenedWindow(state),
    chatroomsMenuToggle: getChatRoomsToggle(state)
})

export default connect(mapStateToProps, { openedChatRoom, closedChatRoom, openedChatRoomsMenu, closedChatRoomsMenu })(ChatRooms);