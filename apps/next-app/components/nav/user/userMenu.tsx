/* eslint-disable no-labels */
import React, { useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import withStyles from '@mui/styles/withStyles';
import Button from '@mui/material/Button';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../store/actions/common';
import { useQueryClient } from 'react-query';
import Badge from '@mui/material/Badge';
import { makeStyles } from '@mui/styles';
import { IUserData, IUserStatusData, Status } from '@pokehub/user/interfaces';
import styles from '../navbar.module.scss';
import { useLogoutUser } from '../../../hooks/auth/useLogoutUser';
import { toast } from 'react-toastify';
import { getAppTheme } from '../../../store/selectors/app';
import { getUserStatus } from '../../../store/selectors/user';
import { RootState } from '../../../store/store';
import { CustomTheme, PaletteMode } from '@mui/material';
import Link from 'next/link';

const StyledMenu: any = withStyles({
  paper: {
    border: '1px solid #d3d4d5',
  },
})((props) => (
  <Menu
    open={false}
    elevation={0}
    //getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'center',
    }}
    {...props}
  />
));

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

interface UserMenuProps {
  user: IUserData;
}

const UserMenu = ({ user }: UserMenuProps) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [enableLogout, setEnableLogout] = React.useState<boolean>(false);
  const result = useLogoutUser(user.uid, enableLogout);
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getAppTheme);
  const status = useSelector<RootState, IUserStatusData>(getUserStatus)
  const classes = useStyles({ userStatus: status.status });

  useEffect(() => {
    result.error && toast.error('Looks like something went wrong. Please try again',
        {
          position: toast.POSITION.TOP_CENTER,
          theme: mode,
          onClose: () => setEnableLogout(false)
        }
      );
  }, [result.error, result.isSuccess]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const logoutUser = () => {
    //queryClient.removeQueries(['users', 'logout', { id: user.uid }]);
    queryClient.clear()
    setEnableLogout(true);
    //dispatch(logout());
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Button onClick={handleClick} style={{ textTransform: 'none' }}>
        <div style={{ marginLeft: '10px', marginRight: '10px' }}>
          <Badge
            variant="dot"
            overlap="circular"
            classes={{ badge: classes.badge }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Avatar src={user.avatarUrl ? user.avatarUrl : '#'} alt={user.username} />
          </Badge>
        </div>
        <span style={{ margin: 0 }} className={`${styles['nav-link']}`}>
          {user.username}
        </span>
      </Button>
      <StyledMenu
        id="customized-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => logoutUser()}>
          <ListItemIcon style={{ minWidth: '30px' }}>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
        <MenuItem>
          <ListItemIcon style={{ minWidth: '30px' }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Preferences" />
        </MenuItem>
        <Link href={`/users/${user.uid}`} passHref>
          <MenuItem>
            <ListItemIcon style={{ minWidth: '30px' }}>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </MenuItem>
        </Link>
      </StyledMenu>
    </div>
  );
};

export default UserMenu;
