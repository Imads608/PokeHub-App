import PropTypes from 'prop-types';

export const OpenedWindowPropTypes = PropTypes.shape({
    type: PropTypes.string.isRequired,
    payload: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired
    })
});

// Open Window Types
export const CHAT_ROOM = 'CHAT_ROOM';
export const CHAT_ROOMS = 'CHAT_ROOMS';
export const DASHBOARD = 'DASHBOARD';
export const NEW_DM = 'NEW_DM';
export const DM = 'DM';