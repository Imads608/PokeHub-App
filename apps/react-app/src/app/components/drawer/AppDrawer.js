import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { connect } from 'react-redux';
import Hidden from "@material-ui/core/Hidden";
import MobileDrawer from './MobileDrawer';
import FullDrawer from './FullDrawer';
import { getDrawerToggle } from '../../selectors/drawer';
import { getIsAuthenticated } from '../../selectors/auth';
import { getAppLoading } from '../../selectors/app';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    maxWidth: drawerWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  }
}));

const AppDrawer = ({isAuthenticated, loading, drawerToggle, navbarRef}) => {
  const classes = useStyles();

  console.log('Navbar Ref', navbarRef.current);

  return (
    isAuthenticated && !loading && (
    <div className={classes.root}>
      <CssBaseline />
      <nav className={classes.drawer}>
        <Hidden mdUp>
          <MobileDrawer drawerToggle={drawerToggle} classes={classes} />
        </Hidden>
        <Hidden smDown>
          <FullDrawer drawerToggle={drawerToggle} classes={classes} drawerRef={navbarRef} />
        </Hidden>
      </nav>
    </div>
  ))
}

const mapStateToProps = (state) => ({
  isAuthenticated: getIsAuthenticated(state),
  loading: getAppLoading(state),
  drawerToggle: getDrawerToggle(state),
})

export default connect(mapStateToProps)(AppDrawer);