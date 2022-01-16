import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import makeStyles from '@mui/styles/makeStyles';

import logo from '../../public/images/pokehub-logo.png';
import Badge from '@mui/material/Badge';
import Link from 'next/link';
import Image from 'next/image';
import styles from './navbar.module.scss';
import { PaletteMode, Theme } from '@mui/material';
import ThemeSwitch from './themeSwitch';
import { toggle_theme } from '../../store/reducers/app';
import { getAppTheme } from '../../store/selectors/app';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';
import { getUser } from '../../store/selectors/user';
import { getIsAuthenticated } from '../../store/selectors/auth';
import { IUserData } from '@pokehub/user/interfaces';
import UserMenu from './user/userMenu';
import UserNotifications from './user/userNotifications';
import { drawer_opened } from '../../store/reducers/drawer';
import { getDrawerToggle } from '../../store/selectors/drawer';

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    position: 'sticky',
    top: 0,
  },
  title: {
    flexGrow: 1,
  },
  navbar: {
    backgroundColor: 'red',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    backgroundColor: 'rgb(199, 0, 57)',
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

interface NavbarProps {
  navRef: any;
}

const Navbar = ({ navRef }: NavbarProps) => {
  const classes: any = useStyles();
  const dispatch: Dispatch = useDispatch();
  const currMode: PaletteMode = useSelector<RootState, PaletteMode>(
    getAppTheme
  );
  const user: IUserData = useSelector<RootState, IUserData>(getUser);
  const isAuthenticated: boolean = useSelector<RootState, boolean>(
    getIsAuthenticated
  );
  const drawerToggle: boolean = useSelector<RootState, boolean>(
    getDrawerToggle
  );

  return (
    <div className={classes.root}>
      <AppBar
        position="sticky"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: false,
        })}
      >
        <Toolbar style={{ minHeight: '7vh' }}>
          <Image height={40} width={40} src={logo} alt="logo" />
          <Typography variant="h6" className={classes.title}>
            <Link href="/">
              <a className={`link ${styles['nav-link']}`}>PokéHub</a>
            </Link>
          </Typography>
          <ThemeSwitch
            checked={currMode === 'dark'}
            onClick={() => dispatch(toggle_theme())}
            mode={currMode}
          />
          {!isAuthenticated ? (
            <div>
              <Link href="/login">
                <a className={`link ${styles['nav-link']}`}>Log In</a>
              </Link>
              <Link href="/register">
                <a className={`link ${styles['nav-link']}`}>Register</a>
              </Link>
            </div>
          ) : (
            <>
              <UserMenu user={user} />
              <UserNotifications />
              <IconButton
                ref={navRef}
                color="inherit"
                aria-label="open drawer"
                edge="end"
                onClick={() => dispatch(drawer_opened())}
                className={clsx(drawerToggle && classes.hide)}
                size="large"
              >
                {/*<Badge badgeContent={unreadDMCount} color='primary'>*/}
                <MenuIcon />
                {/*</Badge>*/}
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Navbar;
