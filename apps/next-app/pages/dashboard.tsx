import { getDrawerToggle } from '../store/selectors/drawer';
import { useSelector } from 'react-redux';
import { RootState, wrapper } from '../store/store';
import { getUser, isProfileSetup } from '../store/selectors/user';
import { getAppTheme } from '../store/selectors/app';
import { IUserData, TypeAccount } from '@pokehub/user/interfaces';
import UserGuide from '../components/dashboard/guide/userGuide';
import { Button, Collapse, Fade, Grow, PaletteMode } from '@mui/material';
import React, { useState } from 'react';
import { createTheme, CustomTheme, CustomThemeOptions } from '@mui/material/styles';
import { getMainAppDesignTokens } from '../styles/mui/themes/theme';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import TrainerCard from '../components/dashboard/trainer-card/trainerCard';
import NavigationLinks from '../components/dashboard/navigation-links/navigationLinks';
import withLoadUser from '../hoc/auth/withLoadUser';
import { GetServerSideProps } from 'next';
import { useTheme } from '@mui/material';

const Dashboard = () => {
  const user: IUserData = useSelector<RootState, IUserData>(getUser);
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getAppTheme);
  const profileSetupFlag = useSelector<RootState, boolean>(isProfileSetup);
  const profileSetupEnable = localStorage.getItem('profile-setup-enable') === null ? true : localStorage.getItem('profile-setup-enable') === 'true';
  const [ guideOpen, setGuideOpen ] = useState<boolean>(profileSetupEnable);
  //const theme: CustomTheme = useTheme();
  const appTheme: CustomTheme = React.useMemo((): CustomTheme => createTheme(getMainAppDesignTokens(mode)), [mode]);

  const closeGuide = () => {
    localStorage.setItem('profile-setup-enable', 'false');
    setGuideOpen(false);
  }

  if (!user) {
    return <div></div>
  }

  console.log('Dashboard:', profileSetupFlag, profileSetupEnable);

  return (
  
    <ThemeProvider theme={appTheme}>
      <div style={{ height: '93vh', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }}>
        <Grow 
          in={!guideOpen ? false : !profileSetupFlag} 
          mountOnEnter 
          unmountOnExit
        >
          <div style={{ width: '100vh' }}><UserGuide user={user} close={closeGuide} /></div>
        </Grow>
        <NavigationLinks theme={appTheme} />
        {/*<div style={{ display: 'flex', flexWrap: 'wrap' }}>
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
        </div>*/}
      </div>
    </ThemeProvider>
  );
};

export default withLoadUser(Dashboard);
