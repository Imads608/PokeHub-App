import PropTypes from 'prop-types';

// Notification Types
export const ERROR = 'ERROR';
export const WARNING = 'WARNING';
export const SUCCESS = 'SUCCESS';
export const INFO = 'INFO';

export const AppNotificationPropTypes = PropTypes.shape({
    type: PropTypes.string,
    component: PropTypes.string,
    message: PropTypes.string,
    desiredState: PropTypes.string,
    otherProps: PropTypes.object
})