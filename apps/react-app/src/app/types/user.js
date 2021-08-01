import PropTypes from 'prop-types';

export const UserPropTypes = PropTypes.shape({
    uid: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    username: PropTypes.string.isRequired,
    emailVerified: PropTypes.bool.isRequired,
    joinedRooms: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired
    })).isRequired
});

export const PublicUserPropTypes = PropTypes.shape({
    uid: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired
});

export const USER_NOTIFICATION = 'user-notification';