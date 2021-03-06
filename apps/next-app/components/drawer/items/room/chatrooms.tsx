import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { chatroom_opened, chatroom_closed, PublicRoomData, } from '../../../../store/reducers/room';
import ChatIcon from '@mui/icons-material/Chat';
import { List, ListItemText, ListItem, MenuItem, Menu, ListItemButton, } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionDetails from '@mui/material/AccordionDetails';
import { Accordion, AccordionSummary } from '../../../custom/accordion';
import CancelIcon from '@mui/icons-material/Cancel';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import { getCurrentOpenedWindow } from '../../../../store/selectors/app';
import { getAllChatRooms, getActiveChatRooms, } from '../../../../store/selectors/room'; 
import { chatrooms_closed, chatrooms_opened, } from '../../../../store/reducers/drawer';
import { getChatRoomsToggle } from '../../../../store/selectors/drawer';
import { OpenedWindow, WindowTypes } from '../../../../store/reducers/app';
import { RootState } from '../../../../store/store';
import styles from '../../drawer.module.scss';
import { Dispatch } from '@reduxjs/toolkit';

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
      color: 'red',
    },
  },
});

const ChatRooms = () => {
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [expand, setExpand] = useState<boolean>(false);
  const classes = useStyles();
  const theme = useTheme();

  const chatrooms: PublicRoomData[] = useSelector<RootState, PublicRoomData[]>( getAllChatRooms );
  const activeRooms: PublicRoomData[] = useSelector< RootState, PublicRoomData[] >(getActiveChatRooms);
  const currentWindow: OpenedWindow = useSelector<RootState, OpenedWindow>( getCurrentOpenedWindow );
  const chatroomsMenuToggle: boolean = useSelector<RootState, boolean>( getChatRoomsToggle );
  const dispatch: Dispatch = useDispatch();

  const openMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const toggleChatRoomsExpand = () => {
    if (!chatroomsMenuToggle) {
      dispatch(chatrooms_opened());
    } else {
      dispatch(chatrooms_closed());
    }
    setExpand(!expand);
  };

  const closeMenu = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  const openChatRoom = (e, room) => {
    e.stopPropagation();
    //openedChatRoom({ pathname: `/chatrooms/${room._id}`, search: '' }, room);
    setAnchorEl(null);
  };

  const closeChat = (opened: string) => {
    dispatch(chatroom_closed(opened));
  };

  return (
    <React.Fragment>
      <Accordion expanded={chatroomsMenuToggle} onChange={() => toggleChatRoomsExpand()} >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header" >
          <List className={classes.headerBlock}>
            <ChatIcon fontSize="large" className={`${styles['drawer-icon']} ${ chatroomsMenuToggle ? styles['drawer-header-expanded'] : styles['drawer-header'] }`} />
            <ListItemText
              primary={
                <h4
                  className={`${styles['drawer-header-text']} ${ chatroomsMenuToggle ? styles['drawer-header-expanded'] : styles['drawer-header'] }`}
                >
                  Chat Rooms
                </h4>
              }
            />
          </List>
        </AccordionSummary>
        <AccordionDetails className={`${styles['drawer-accordion-details']}`}>
          <List className={styles['drawer-expanded-list']}>
            {activeRooms && activeRooms.map((opened: PublicRoomData) => (
                <Link key={opened.id} href={{ pathname: opened.state.url.pathname, query: opened.state.url.query, }} passHref>
                  <ListItemButton
                    selected={ currentWindow.type === WindowTypes.CHAT_ROOM && currentWindow.payload && currentWindow.payload.id === opened.id }
                    className={styles['drawer-expanded-list-item']}
                  >
                    {currentWindow.type === WindowTypes.CHAT_ROOM && currentWindow.payload && currentWindow.payload.id === opened.id && (
                        <CancelIcon
                          fontSize="small"
                          className={classes.closeIcon}
                          onClick={() => closeChat(opened.id)}
                        />
                      )}
                    <ListItemText
                      primary={
                        <h5 className={`${styles['drawer-header-text']} ${ styles['drawer-expanded-list-item-text'] } 
                                       ${ currentWindow.type === WindowTypes.CHAT_ROOM && currentWindow.payload && 
                                          currentWindow.payload.id === opened.id ? styles[ 'drawer-header-expanded' ] : 
                                          styles['drawer-header'] }`} >
                          # {opened.name}
                        </h5>
                      }
                    />
                  </ListItemButton>
                </Link>
              ))}
            <ListItem
              button
              disabled={ activeRooms && activeRooms.length === chatrooms.length ? true : false }
              onClick={openMenu}
              className={styles['drawer-expanded-list-item']}
            >
              <AddIcon fontSize="small" />
              <ListItemText
                primary={
                  <h5
                    className={`${styles['drawer-header-text']} ${styles['drawer-expanded-list-item-text']} ${styles['drawer-header']}`}
                  >
                    Open New Chat Room
                  </h5>
                }
              />
              <Menu id="simple-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu} >
                {chatrooms && chatrooms.map( (room, id) =>
                      !activeRooms.find((opened) => opened.id === room.id) && (
                        <Link href={`/chatrooms/${room.id}`} passHref>
                          <MenuItem className="drawer-header" key={id} onClick={closeMenu} >
                            #{room.name}
                          </MenuItem>
                        </Link>
                      )
                  )}
              </Menu>
            </ListItem>
            <Link href="/chatrooms" passHref>
              <ListItemButton className={styles['drawer-expanded-list-item']}>
                <ListItemText
                  primary={
                    <h5
                      className={`${styles['drawer-header-text']} ${styles['drawer-expanded-list-item-text']} ${styles['drawer-header']}`}
                    >
                      View All Chat Rooms
                    </h5>
                  }
                />
              </ListItemButton>
            </Link>
          </List>
        </AccordionDetails>
      </Accordion>
    </React.Fragment>
  );
};

export default ChatRooms;
