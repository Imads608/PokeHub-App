import { getDrawerToggle } from '../store/selectors/drawer';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getUser } from '../store/selectors/user';
import { getAppTheme } from '../store/selectors/app';
import { IUserData } from '@pokehub/user';
import UserGuide from '../components/dashboard/guide/userGuide';
import { Button, PaletteMode } from '@mui/material';
import React from 'react';
import { createTheme, CustomTheme, CustomThemeOptions } from '@mui/material/styles';
import { getDashboardDesignTokens } from '../styles/mui/themes/theme';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

const Dashboard = () => {
  const drawerToggle: boolean = useSelector<RootState, boolean>( getDrawerToggle );
  const user: IUserData = useSelector<RootState, IUserData>(getUser);
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getAppTheme);
  const dashboardTheme: CustomTheme = React.useMemo((): CustomTheme => createTheme(getDashboardDesignTokens(mode)), [mode]);

  return (
    <ThemeProvider theme={dashboardTheme}>
      <div style={{ height: '93vh', padding: '15px' }}>
        <UserGuide user={user} />
        <Button color='primary'>
          Click
        </Button>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
          <div>Authenticated</div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Dashboard;
