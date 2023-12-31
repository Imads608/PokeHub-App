import React, { useEffect } from 'react';
import { setChatRoomState } from '../../../actions/chat';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ChatroomPropTypes } from '../../../types/chatroom';
import '../chat.css';

const Rules = ({ location, room, setChatRoomState }) => {
  useEffect(() => {
    setChatRoomState(
      { url: { pathname: location.pathname, search: location.search } },
      room.id
    );
  }, []);

  return <div className="main-window">Rules</div>;
};

Rules.propTypes = {
  location: PropTypes.object.isRequired,
  room: ChatroomPropTypes.isRequired,
  setChatRoomState: PropTypes.func.isRequired,
};

export default connect(null, { setChatRoomState })(Rules);
