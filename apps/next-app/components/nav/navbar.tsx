import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import logo from '../../public/images/pokehub-logo.png';
import Link from 'next/link';
import Image from 'next/image';
import styles from './navbar.module.scss';
import { CustomTheme, PaletteMode } from '@mui/material';
import ThemeSwitch from './themeSwitch';
import { toggle_theme } from '../../store/reducers/app';
import { getPaletteTheme } from '../../store/selectors/app';
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
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme: CustomTheme) => ({
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
  }
}));

interface NavbarProps {
  navRef: React.MutableRefObject<HTMLButtonElement>;
}

const Navbar = ({ navRef }: NavbarProps) => {
  const { classes } = useStyles();
  const dispatch: Dispatch = useDispatch();
  const currMode: PaletteMode = useSelector<RootState, PaletteMode>(
    getPaletteTheme
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
        className={classes.appBar}
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
                className={clsx(drawerToggle)}
                size="large"
              >
                <MenuIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Navbar;
