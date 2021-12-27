import React, { useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import CssBaseline from '@mui/material/CssBaseline';
import { useSelector } from 'react-redux';
import Hidden from '@mui/material/Hidden';
import MobileDrawer from './mobile/mobileDrawer';
import FullDrawer from './web/fullDrawer';
import { getIsAuthenticated } from '../../store/selectors/auth';
import { getDrawerToggle } from '../../store/selectors/drawer';
import { getAppLoading } from '../../store/selectors/app';
import { Theme } from '@mui/material';
import { RootState } from '../../store/store';

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) => ({
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
  },
}));

interface MainDrawerProps {
  navRef: any;
}

const MainDrawer = ({ navRef }: MainDrawerProps) => {
  const classes: any = useStyles();

  const isAuthenticated: boolean = useSelector<RootState, boolean>(
    getIsAuthenticated
  );
  const appLoading: boolean = useSelector<RootState, boolean>(getAppLoading);
  const drawerToggle: boolean = useSelector<RootState, boolean>(
    getDrawerToggle
  );

  console.log('Navbar Ref', navRef.current);

  return (
    isAuthenticated &&
    !appLoading && (
      <div className={classes.root}>
        <CssBaseline />
        <nav className={classes.drawer}>
          <Hidden mdUp>
            <MobileDrawer classes={classes} />
          </Hidden>
          <Hidden mdDown>
            <FullDrawer classes={classes} drawerRef={navRef} />
          </Hidden>
        </nav>
      </div>
    )
  );
};

export default MainDrawer;
