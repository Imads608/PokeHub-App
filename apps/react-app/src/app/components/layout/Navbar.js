import React, { useEffect } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import clsx from 'clsx';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';

import { Link } from 'react-router-dom';
import logo from './pokehub-logo.png';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { openedDrawer } from '../../actions/drawer';
import { getAppLoading } from '../../selectors/app';
import { getUser } from '../../selectors/user';
import { getIsAuthenticated, getAuthLoading } from '../../selectors/auth';
import { getDrawerToggle } from '../../selectors/drawer';
import UserMenu from './UserMenu';
import UserNotifications from './UserNotifications';
import { getOpenedDM, getTotalUnreadDMs } from '../../selectors/chat';
import { resetDMUnreadMessages } from '../../actions/chat';
import Badge from '@material-ui/core/Badge';


const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'sticky',
    top: 0
  },
  title: {
    flexGrow: 1,
  },
  navbar: {
    backgroundColor: 'rgb(199, 0, 57)'
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    backgroundColor: 'rgb(199, 0, 57)'
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerWidth,
  },
}));

const Navbar = ({ isAuthenticated, loading, drawerToggle, user, authLoading, currentDM, openedDrawer, resetDMUnreadMessages, unreadDMCount, navbarRef }) => {
  useEffect(() => {
    currentDM && currentDM.state.unread > 0 && resetDMUnreadMessages(currentDM.id);
  }, [currentDM])

  console.log('Navbar Ref in Navbar', navbarRef.current);

  const classes = useStyles();
  return (
      <div className={classes.root}>
        <AppBar position="sticky" className={clsx(classes.appBar, {
          [classes.appBarShift]: drawerToggle,
        })}>
          <Toolbar style={{minHeight: '7vh'}}>
            <img id='logo' src={logo}/>
            <Typography variant="h6" className={classes.title}>
              <Link className='link nav-link' to={`${isAuthenticated ? '/dashboard' : '/'}`}>PokéHub</Link>
            </Typography>
            
            {!isAuthenticated && !authLoading ? (
              <div>
                <Link to='/login' className='link nav-link'>Log In</Link>
                <Link to='/register' className='link nav-link'>Register</Link>
              </div>
            ) : !loading ? (
              <div style={{ display: 'flex'}}>
                <UserMenu user={user} />
                <UserNotifications />
                <IconButton
                  ref={navbarRef}
                  color="inherit"
                  aria-label="open drawer"
                  edge="end"
                  onClick={() => openedDrawer()}
                  className={clsx(drawerToggle && classes.hide)}
                >
                  <Badge badgeContent={unreadDMCount} color='primary'>
                    <MenuIcon />
                  </Badge>
                </IconButton>
              </div>
            ) : ''}
            
          </Toolbar>
        </AppBar>
      </div>
  );
}

Navbar.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  drawerToggle: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired,
  authLoading: PropTypes.bool.isRequired,
  openedDrawer: PropTypes.func.isRequired,
  currentDM: PropTypes.object,
  unreadDMCount: PropTypes.number.isRequired,
  resetDMUnreadMessages: PropTypes.func.isRequired
}

const mapStateToProps = (state) => ({
  isAuthenticated: getIsAuthenticated(state),
  loading: getAppLoading(state),
  drawerToggle: getDrawerToggle(state),
  user: getUser(state),
  authLoading: getAuthLoading(state),
  currentDM: getOpenedDM(state),
  unreadDMCount: getTotalUnreadDMs(state)
})

export default connect(mapStateToProps, { openedDrawer, resetDMUnreadMessages })(Navbar);