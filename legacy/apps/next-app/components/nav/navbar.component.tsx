import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { CustomTheme, PaletteMode, createTheme, ThemeProvider } from '@mui/material';
import ThemeSwitch from './theme/theme-switch.component';
import { toggle_theme } from '../../store/app/app.reducer';
import { getPaletteTheme } from '../../store/app/app.selector';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';
import { useMemo } from 'react';
import { getNavbarDesignTokens } from 'apps/next-app/styles/mui/themes/navbar.theme';
import { useTheme } from '@mui/material/styles';
import AuthNavigation from './auth/auth-navigation.component';
import AppLogo from './logo/app-logo.component';
import { useNavStyles } from './navbar.styles';

interface NavbarProps {
  navRef: React.MutableRefObject<HTMLButtonElement>;
}

const NavbarWithTheme = (props: NavbarProps) => {
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getPaletteTheme);
  const outerTheme = useTheme();
  const navTheme: CustomTheme = useMemo((): CustomTheme => createTheme(getNavbarDesignTokens(mode, outerTheme)), [mode]);

  return (
    <ThemeProvider theme={navTheme}>
      <Navbar {...props} />
    </ThemeProvider>
  )
}

const Navbar = ({ navRef }: NavbarProps) => {
  const { classes } = useNavStyles();
  const dispatch: Dispatch = useDispatch();
  const currMode: PaletteMode = useSelector<RootState, PaletteMode>(
    getPaletteTheme
  );

  return (
    <AppBar
      position="sticky"
      className={classes.appBar}
    >
      <Toolbar className={classes.toolBar}>
        <AppLogo classes={classes} />
        <ThemeSwitch
          checked={currMode === 'dark'}
          onClick={() => dispatch(toggle_theme())}
          mode={currMode}
        />
        <AuthNavigation />
      </Toolbar>
    </AppBar>
  );
};

export default NavbarWithTheme;
