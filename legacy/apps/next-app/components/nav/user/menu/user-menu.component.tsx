/* eslint-disable no-labels */
import React, { useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from 'react-query';
import Badge from '@mui/material/Badge';
import { IUserData, IUserStatusData, Status } from '@pokehub/user/interfaces';
import { useLogoutUser } from '../../../../hooks/auth/logout-user.hook';
import { toast } from 'react-toastify';
import { getPaletteTheme } from '../../../../store/app/app.selector';
import { getUserStatus, getUsersNSClientId } from '../../../../store/user/user.selector';
import { RootState } from '../../../../store/store';
import { CustomTheme, PaletteMode } from '@mui/material';
import { StyledMenu } from '../../../common/menu-bar/styled-menu.component';
import UserMenuItems from './menu-items/user-menu-items.component';
import StatusMenuItems from './menu-items/status-menu-items.component';
import { status_update } from '../../../../store/user/user.reducer';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles<{ userStatus: Status }>()((theme: CustomTheme, { userStatus }) => ({
  badge: {
    fontSize: 'x-large',
    height: '12px',
    width: '12px',
    borderRadius: '10px',
    backgroundColor: userStatus === Status.ONLINE ? theme.palette.success.main : userStatus === Status.AWAY || userStatus === Status.APPEAR_AWAY ?
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
  const [menuType, setMenuType] = React.useState<'main-menu' | 'status-menu'>('main-menu');
  const result = useLogoutUser(user.uid, enableLogout);
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getPaletteTheme);
  const status = useSelector<RootState, IUserStatusData>(getUserStatus);
  const socketId = useSelector<RootState, string>(getUsersNSClientId);
  const { classes } = useStyles({ userStatus: status.state });

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
    setMenuType('main-menu');
  };

  const logoutUser = () => {
    //queryClient.removeQueries(['users', 'logout', { id: user.uid }]);
    queryClient.clear()
    setEnableLogout(true);
    //dispatch(logout());
  };

  const changeStatus = (newStatus: Status) => {
    dispatch(status_update({ id: user.status.id, isHardUpdate: true, lastSeen: new Date(), socketId, state: newStatus, uid: user.uid, username: user.username }));
  }

  const toggleMenu = (desiredMenu: 'main-menu' | 'status-menu') => {
    console.log('userMenu: toggling menu type to', desiredMenu);
    setMenuType(desiredMenu);
  }

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
        <span style={{ margin: 0, color: 'white' }}>
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
        { menuType === 'main-menu' ? <UserMenuItems user={user} classes={classes} logoutUser={logoutUser} toggleMenu={toggleMenu} /> :
          <StatusMenuItems userStatus={status} classes={classes} toggleMenu={toggleMenu} changeStatus={changeStatus} />}
      </StyledMenu>
    </div>
  );
};

export default UserMenu;
