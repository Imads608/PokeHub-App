import PropTypes from 'prop-types';

export const UserPropTypes = PropTypes.shape({
  uid: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  username: PropTypes.string.isRequired,
  emailVerified: PropTypes.bool.isRequired,
  joinedPublicRooms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
});

export const PublicUserPropTypes = PropTypes.shape({
  uid: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
});

export const USER_NOTIFICATION = 'user-notification';
