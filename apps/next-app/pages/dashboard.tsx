import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getUser, isProfileSetup } from '../store/selectors/user';
import { getPaletteTheme } from '../store/selectors/app';
import { IUserData } from '@pokehub/user/interfaces';
import UserGuide from '../components/dashboard/guide/userGuide';
import { Grow, PaletteMode } from '@mui/material';
import React, { useState } from 'react';
import { createTheme, CustomTheme } from '@mui/material/styles';
import { getMainAppDesignTokens } from '../styles/mui/themes/theme';
import { ThemeProvider } from '@mui/material/styles';
import NavigationLinks from '../components/dashboard/navigation-links/navigationLinks';
import withLoadUser from '../hoc/auth/withLoadUser';
import { usePageStyles } from "../hooks/styles/common/usePageStyles";

const Dashboard = () => {
  const { classes } = usePageStyles({ padding: '15px', alignItems: 'center', overflow: 'auto' });
  const user: IUserData = useSelector<RootState, IUserData>(getUser);
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getPaletteTheme);
  const profileSetupFlag = useSelector<RootState, boolean>(isProfileSetup);
  const profileSetupEnable = localStorage.getItem('profile-setup-enable') === null ? true : localStorage.getItem('profile-setup-enable') === 'true';
  const [ guideOpen, setGuideOpen ] = useState<boolean>(profileSetupEnable);
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
      <main className={classes.root}>
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
      </main>
    </ThemeProvider>
  );
};

export default withLoadUser(Dashboard);
