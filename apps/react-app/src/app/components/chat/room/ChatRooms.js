import React from 'react';
import { useSelector } from 'react-redux';
import Loading from '../../layout/Loading';
import { Link } from 'react-router-dom';
import useInitialLoad from '../../../hooks/useInitialLoad';
import { getAllChatRooms } from '../../../selectors/chat';

const ChatRooms = () => {
  const publicRooms = useSelector(getAllChatRooms);
  const { data, error, isLoading } = useInitialLoad('CHAT_ROOMS', null);

  return (
    <React.Fragment>
      {isLoading ? (
        <Loading />
      ) : (
        publicRooms.map((room) => (
          <Link key={room.id} to={`/chatrooms/${room.id}`}>
            {room.name}
          </Link>
        ))
      )}
    </React.Fragment>
  );
};

export default ChatRooms;
