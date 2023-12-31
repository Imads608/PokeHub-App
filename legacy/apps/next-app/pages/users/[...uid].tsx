import { NextRouter, useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import React from 'react';
import { useUserPublicProfile } from '../../hooks/user/user-public-profile.hook';
import TrainerCard from '../../components/user/profile/trainer-card/trainer-card.component';
import { CustomTheme, createTheme, PaletteMode } from '@mui/material';
import { getAppMainDesignTokens } from '../../styles/mui/themes/theme';
import { getPaletteTheme } from '../../store/app/app.selector';
import { ThemeProvider } from '@mui/styles';
import RestError from '../../components/common/rest-error/rest-error.component';
import { AxiosError } from 'axios';
import { APIError } from '../../types/api';
import About from '../../components/user/profile/trainer-card/card-items/about.component';
import { usePageStyles } from 'apps/next-app/hooks/styles/common/page.styles';
import BattleStats from 'apps/next-app/components/user/profile/trainer-card/card-items/battle-stats.component';
import Friends from 'apps/next-app/components/user/profile/trainer-card/card-items/friends.component';
import ActiveRooms from 'apps/next-app/components/user/profile/trainer-card/card-items/active-rooms.component';
import Teams from 'apps/next-app/components/user/profile/trainer-card/card-items/teams.component';
import PageLayout from 'apps/next-app/components/common/page-layout/page-layout.component';


const UserProfile = () => {
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getPaletteTheme);
  const appTheme: CustomTheme = React.useMemo((): CustomTheme => createTheme(getAppMainDesignTokens(mode)), [mode]);
  const { classes } = usePageStyles();
  const router: NextRouter = useRouter();
  const { uid } = router.query;
  const res = useUserPublicProfile(uid as string);
  const resError = res.error as AxiosError<APIError>


  return (
    <ThemeProvider theme={appTheme}>
      <PageLayout>
        <main className={classes.root}>
          {res.isLoading ? '' : res.isError ? <RestError message={resError.response.data.message} /> : (
            <div style={{ height: '100%' }}>
              <TrainerCard userProfile={res.data}/>
              <About />
              <BattleStats />
              <Friends />
              <ActiveRooms />
              <Teams />
            </div>
          )}
        </main>
      </PageLayout>
    </ThemeProvider>
  )
};

export default UserProfile;
