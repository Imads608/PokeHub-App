import React from 'react';
import { connect } from 'react-redux';
import { getAllChatRooms, getOpenedDM } from '../../selectors/chat';
import { getPublicUser } from '../../selectors/user';
import { DMPropTypes, TYPE_CHAT_DM } from '../../types/dm';
import { PublicUserPropTypes } from '../../types/user';
import { ChatroomPropTypes, TYPE_CHAT_CHATROOM } from '../../types/chatroom';
import PropTypes from 'prop-types';

import { useDMLoad } from '../../hooks/useDMLoad';
import useConversationLoad from '../../hooks/useConversationLoad';

const WithConversation = (Component, typeChat) => {
  const ConversationHOC = (props) => {
    const paths = props.location ? props.location.pathname.split('/') : null;
    const pathsVal = paths ? paths[paths.length - 1] : null;
    const isDMRoute =
      props.location &&
      props.location.pathname.includes('/dms') &&
      pathsVal !== 'dms';

    const dmId =
      typeChat === TYPE_CHAT_DM && isDMRoute && paths
        ? paths[paths.length - 1]
        : typeChat === TYPE_CHAT_DM && props.currentDM
        ? props.currentDM.id
        : null;
    const chatroomId = typeChat === TYPE_CHAT_CHATROOM ? props.room.id : null;

    const {
      error: dmConvError,
      isLoading: dmConvLoading,
      refetch: dmRefetch,
    } = useConversationLoad(
      dmId,
      typeChat,
      dmId && props.currentDM && !props.currentDM.isConversationLoaded
    );
    const { error: dmError, isLoading: dmLoading } = useDMLoad(
      dmId,
      props.publicUser,
      'NewDM_LINK',
      !props.currentDM
    );
    const {
      error: roomConvError,
      isLoading: roomConvLoading,
      refetch: roomRefetch,
    } = useConversationLoad(
      chatroomId,
      typeChat,
      chatroomId && props.isMember && !props.room.state.isConversationLoaded
    );

    const reloadConversation = () => {
      typeChat === TYPE_CHAT_DM && dmConvError && dmRefetch();
      typeChat === TYPE_CHAT_CHATROOM && roomConvError && roomRefetch();
    };

    const isError = () => {
      return typeChat === TYPE_CHAT_DM
        ? dmError || dmConvError
          ? true
          : false
        : roomConvError
        ? true
        : false;
    };

    const isLoading = () => {
      return typeChat === TYPE_CHAT_DM
        ? dmConvLoading || dmLoading
          ? true
          : false
        : roomConvLoading
        ? true
        : false;
    };

    return (
      <Component
        {...props}
        reloadConversation={reloadConversation}
        error={isError()}
        loading={isLoading()}
      />
    );
  };

  ConversationHOC.propTypes = {
    currentDM: DMPropTypes,
    room: ChatroomPropTypes,
    chatrooms: PropTypes.arrayOf(ChatroomPropTypes),
    publicUser: PublicUserPropTypes,
  };

  const mapStateToProps = (state) => ({
    chatrooms: getAllChatRooms(state),
    publicUser: getPublicUser(state),
    currentDM: getOpenedDM(state),
  });

  return connect(mapStateToProps)(ConversationHOC);
};

export default WithConversation;
