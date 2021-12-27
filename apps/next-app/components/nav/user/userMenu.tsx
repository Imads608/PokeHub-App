/* eslint-disable no-labels */
import React from 'react';
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
import { useDispatch } from 'react-redux';
import { logout } from '../../../store/actions/common';
import { useQueryClient } from 'react-query';
import Badge from '@mui/material/Badge';
import { makeStyles } from '@mui/styles';
import { IUserData } from '@pokehub/user';
import styles from '../navbar.module.scss';

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

interface UserMenuProps {
  user: IUserData;
}

const UserMenu = ({ user }: UserMenuProps) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const logoutUser = () => {
    queryClient.removeQueries('user-login');
    queryClient.removeQueries('user-signup');
    dispatch(logout());
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Button onClick={handleClick} style={{ textTransform: 'none' }}>
        <div style={{ marginLeft: '10px', marginRight: '10px' }}>
          <Badge
            variant="dot"
            overlap="circular"
            color="success"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Avatar src="" />
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
        <MenuItem>
          <ListItemIcon style={{ minWidth: '30px' }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
      </StyledMenu>
    </div>
  );
};

export default UserMenu;
