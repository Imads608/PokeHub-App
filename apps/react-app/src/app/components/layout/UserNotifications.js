import { IconButton } from '@material-ui/core';
import NotificationsIcon from '@material-ui/icons/Notifications';
import React from 'react';


const UserNotifications = () => {
    return (
        <div>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              style={{ marginRight: '5px' }}
              onClick={() => console.log('Clicked')}
            >
              <NotificationsIcon />
            </IconButton>
        </div>
    )
}

export default UserNotifications;