import React from 'react';
import { Link } from 'react-router-dom';
import ChatRoomSidebar from './ChatRoomSidebar';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import '../chat.css';

const ChatMobileHeader = ({ chatroom, navLinks, location }) => {
  return (
    <div className="chat-mobile-sidebar-header">
      <div className="theme-text">
        <Link
          className={`link nav-link ${
            location.search === ''
              ? 'chat-mobile-sidebar-link-selected'
              : 'chat-mobile-sidebar-link'
          }`}
          to={`/chatrooms/${chatroom.id}`}
        >
          # {chatroom.name}
        </Link>
      </div>
      <ChatRoomSidebar links={navLinks} location={location} />
    </div>
  );
};

ChatMobileHeader.propTypes = {
  chatroom: PropTypes.object.isRequired,
  navLinks: PropTypes.array.isRequired,
  location: PropTypes.object.isRequired,
};

export default ChatMobileHeader;
