import { IconButton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const UserNotifications = () => {
    return (
        <div>
            <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                style={{ marginRight: '5px' }}
                onClick={() => console.log('Clicked')}
                size="large">
              <NotificationsIcon />
            </IconButton>
        </div>
    );
}

export default UserNotifications;