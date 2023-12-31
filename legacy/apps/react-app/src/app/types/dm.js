import PropTypes from 'prop-types';
import { PublicUserPropTypes } from './user';
import { MessagePropTypes } from './message';

export const DMPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  participants: PropTypes.arrayOf(PublicUserPropTypes).isRequired,
  state: PropTypes.shape({
    messages: PropTypes.arrayOf(MessagePropTypes).isRequired,
    unread: PropTypes.number.isRequired,
    isConversationLoaded: PropTypes.bool.isRequired,
    isOpened: PropTypes.bool.isRequired,
  }),
});

export const DIRECT_MESSAGE = 'DIRECT_MESSAGE';
export const DM_LOAD_ERROR =
  'Unable to get DM Details. Please try again later.';
export const DM_CREATE_ERROR = 'Unable to create DM. Please try again later';
export const TYPE_CHAT_DM = 'private-dm';
export const VIEW_TYPE_POPPER = 'POPPER';
export const VIEW_TYPE_LINK = 'LINK';
export const NEW_DM = 'NEW_DM';
export const JOIN_DMs = 'JOIN_DMs';
