import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import '../chat.css';

const ChatRoomSidebar = ({ links, location }) => {
  return (
    <div className="chat-mobile-sidebar">
      {links.map((link, id) => {
        const search = `?view=${link.toLowerCase()}`;
        return (
          <Link
            className={`${
              location.search === search
                ? 'chat-mobile-sidebar-link-selected'
                : 'chat-mobile-sidebar-link'
            }`}
            key={id}
            to={{
              pathname: location.pathname,
              search: `${search}`,
              state: search === '?view=lobby' ? { from: location } : null,
            }}
          >
            {link}
          </Link>
        );
      })}
    </div>
  );
};

ChatRoomSidebar.propTypes = {
  links: PropTypes.arrayOf(PropTypes.string).isRequired,
  location: PropTypes.object.isRequired,
};

export default ChatRoomSidebar;
