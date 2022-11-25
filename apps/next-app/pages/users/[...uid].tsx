import { NextRouter, useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import React from 'react';
import { useUserPublicProfile } from '../../hooks/user/useUserPublicProfile';
import TrainerCard from '../../components/user/profile/trainerCard';
import { CustomTheme, createTheme, PaletteMode } from '@mui/material';
import { getAppMainDesignTokens } from '../../styles/mui/themes/theme';
import { getPaletteTheme } from '../../store/selectors/app';
import { ThemeProvider } from '@mui/styles';
import RestError from '../../components/common/rest-error/restError';
import { AxiosError } from 'axios';
import { APIError } from '../../types/api';
import About from '../../components/user/profile/about';
import BattleStats from '../../components/user/profile/battleStats';
import Friends from '../../components/user/profile/friends';
import ActiveRooms from '../../components/user/profile/activeRooms';
import Teams from '../../components/user/profile/teams';
import { makeStyles } from 'tss-react/mui';
import { usePageStyles } from 'apps/next-app/hooks/styles/common/usePageStyles';


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
    </ThemeProvider>
  )
};

export default UserProfile;
