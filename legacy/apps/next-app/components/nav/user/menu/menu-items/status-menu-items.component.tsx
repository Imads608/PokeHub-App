import { Badge, CustomTheme, Divider, ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { IUserStatusData, Status } from "@pokehub/user/interfaces";
import { ClassNameMap, makeStyles } from "@mui/styles";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const useStyles = makeStyles<CustomTheme, { userStatus: Status }>((theme: CustomTheme) => ({
    badge: {
      fontSize: 'x-large',
      height: '12px',
      width: '12px',
      borderRadius: '10px',
      backgroundColor: ({userStatus}) => userStatus === Status.ONLINE ? theme.palette.success.main : userStatus === Status.AWAY || userStatus === Status.APPEAR_AWAY ?
                        theme.palette.warning.main : userStatus === Status.BUSY || userStatus === Status.APPEAR_BUSY ? theme.palette.error.main :
                        'grey'
    }
  }));

interface StatusMenuItemsProps {
    userStatus: IUserStatusData;
    classes: ClassNameMap<string>;
    toggleMenu: (desiredMenu: 'main-menu' | 'status-menu') => void;
    changeStatus: (newStatus: Status) => void;
}

const StatusMenuItems = ({ userStatus, classes, toggleMenu, changeStatus }: StatusMenuItemsProps) => {
    const statuses = [Status.ONLINE, Status.APPEAR_AWAY, Status.APPEAR_BUSY, Status.APPEAR_OFFLINE];
    const statusText = [ 'Online', 'Appear Away', 'Appear Busy', 'Appear Offline'];
    const statusClasses = {
        [Status.ONLINE]: useStyles({ userStatus: Status.ONLINE }),
        [Status.OFFLINE]: useStyles({ userStatus: Status.OFFLINE }),
        [Status.AWAY]: useStyles({ userStatus: Status.AWAY }),
        [Status.BUSY]: useStyles({ userStatus: Status.BUSY }),
        [Status.APPEAR_AWAY]: useStyles({ userStatus: Status.APPEAR_AWAY }),
        [Status.APPEAR_BUSY]: useStyles({ userStatus: Status.APPEAR_BUSY }),
        [Status.APPEAR_OFFLINE]: useStyles({ userStatus: Status.APPEAR_OFFLINE })
    }
    
    return (
        <>
            <MenuItem onClick={() => toggleMenu('main-menu')} style={{ borderBottom: '2px solid grey' }}>
                <ChevronLeftIcon style={{ marginLeft: '-4px' }} />
                <ListItemIcon style={{ minWidth: '30px' }}>
                    <Badge
                    variant="dot"
                    overlap="circular"
                    classes={{ badge: classes.badge }}
                    style={{ marginLeft: '8px', color: 'orange' }}
                    />
                </ListItemIcon>
                <ListItemText primary="Current Status" />
            <Divider style={{ color: 'orange' }} variant='inset' component='br' />
            </MenuItem>
            {statuses.map((status, index) => (
                status != userStatus.state && (
                    <MenuItem key={index} onClick={() => changeStatus(status)}>
                        <ListItemIcon style={{ minWidth: '30px' }}>
                            <Badge
                            variant="dot"
                            overlap="circular"
                            classes={{ badge: statusClasses[status].badge }}
                            style={{ marginLeft: '8px', color: 'orange' }}
                            />
                        </ListItemIcon>
                        <ListItemText primary={statusText[index]} />
                    </MenuItem>
                )
            ))}
        </>
    )
}

export default StatusMenuItems;