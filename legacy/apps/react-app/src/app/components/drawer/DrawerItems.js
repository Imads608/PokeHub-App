import { Divider } from '@mui/material';
import React, { useRef } from 'react';
import ChatRooms from './chat/room/ChatRooms';
import DMs from './chat/dm/DMs';

const DrawerItems = ({ drawerRef }) => {
  //const drawerRef = useRef(null);

  return (
    <div>
      <Divider />
      <DMs drawerRef={drawerRef} />
      <ChatRooms />
    </div>
  );
};

export default DrawerItems;
