import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import SettingsIcon from '@material-ui/icons/Settings';
import PersonIcon from '@material-ui/icons/Person';
import { connect, useDispatch } from 'react-redux';
import { loggedOut } from '../../actions/auth';
import { useQueryClient } from 'react-query';

const StyledMenu = withStyles({
    paper: {
      border: '1px solid #d3d4d5',
    },
  })((props) => (
    <Menu
      elevation={0}
      getContentAnchorEl={null}
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
  
const UserMenu = ({ user }) => {
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
      queryClient.removeQueries("user-login");
      queryClient.removeQueries('user-signup');
      dispatch(loggedOut());
    }
    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button onClick={handleClick} style={{ textTransform: 'none' }}>
                <Avatar style={{ marginLeft: '10px', marginRight: '10px' }} src='/broken-image.jpg' />
                <span style={{ margin: 0 }} className='nav-link'>{user.username}</span>
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
    )
}

export default UserMenu;