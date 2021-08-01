import PropTypes from 'prop-types';
import { PublicUserPropTypes } from './user';

export const MessagePropTypes = PropTypes.shape({
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    author: PublicUserPropTypes,
    time: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    roomId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    to: PropTypes.oneOfType([PropTypes.arrayOf(PublicUserPropTypes), PropTypes.string]).isRequired,
    socketId: PropTypes.string,
    type: PropTypes.string
})