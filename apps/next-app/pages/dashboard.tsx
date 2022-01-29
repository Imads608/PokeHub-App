import { getDrawerToggle } from '../store/selectors/drawer';
import { useSelector } from 'react-redux';
import { RootState, wrapper } from '../store/store';
import { getUser } from '../store/selectors/user';
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
//import { useTheme } from '@emotion/react';

const Dashboard = () => {
  const user: IUserData = useSelector<RootState, IUserData>(getUser);
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getAppTheme);
  const [ guideOpen, setGuideOpen ] = useState<boolean>(true);
  //const theme: CustomTheme = useTheme();
  const appTheme: CustomTheme = React.useMemo((): CustomTheme => createTheme(getMainAppDesignTokens(mode)), [mode]);

  const closeGuide = () => setGuideOpen(false);

  if (!user) {
    return <div></div>
  }

  return (
  
    <ThemeProvider theme={appTheme}>
      <div style={{ height: '93vh', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }}>
        <Grow in={user.avatar && (user.account === TypeAccount.REGULAR || ( user.account === TypeAccount.GOOGLE && user.countUsernameChanged > 0)) 
                  ? false : guideOpen} mountOnEnter unmountOnExit>
          <div><UserGuide user={user} close={closeGuide} /></div>
        </Grow>
        <NavigationLinks theme={appTheme} />
        <TrainerCard user={user} />
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
