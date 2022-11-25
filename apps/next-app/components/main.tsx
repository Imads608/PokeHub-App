import React, { useEffect, useRef } from 'react';
import { RootState } from '../store/store';
import Navbar from '../components/nav/navbar';
import useLoadUser from '../hooks/auth/useLoadUser';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CssBaseline, useMediaQuery } from '@mui/material';
import { useSelector } from 'react-redux';
import { CustomTheme } from '@mui/material';
import RouteGuard from '../components/auth/guards/routeGuard';
import MainDrawer from '../components/drawer/mainDrawer';
import { getDrawerToggle } from '../store/selectors/drawer';
import { getIsAuthenticated, getAuthLoading, getInitialAccessToken } from '../store/selectors/auth';
import { getIsRefreshNeeded } from '../store/selectors/user';
import { start_websocket_connection } from '../store/reducers/user';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import http from '../axios';
import { NextComponent, PageProps } from '../types/next';
import { useUserTrackerStatus } from '../hooks/user/useUserStatusTracker';
import { useRootStyles } from '../hooks/styles/useRootStyles';


export interface MainProps {
    theme: CustomTheme;
    Component: NextComponent;
    pageProps: PageProps;
}

const Main = ({ Component, pageProps, theme }: MainProps) => {
  const navRef: React.MutableRefObject<HTMLButtonElement> = useRef(null);
  const drawerToggle: boolean = useSelector<RootState, boolean>(getDrawerToggle);
  const isAuthenticated: boolean = useSelector<RootState, boolean>(getIsAuthenticated);
  const authLoading: boolean = useSelector<RootState, boolean>(getAuthLoading);
  const isSocketRefreshNeeded = useSelector<RootState, boolean>(getIsRefreshNeeded);
  const initialAccessToken = useSelector<RootState, string>(getInitialAccessToken);
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  useLoadUser(null, !isAuthenticated && authLoading)
  const dispatch = useDispatch();
  const { classes } = useRootStyles();
  
  useEffect(() => {
    if (isAuthenticated) {
      start();
      http.defaults.headers.Authorization = http.defaults.headers.Authorization ? http.defaults.headers.Authorization : initialAccessToken;
      dispatch(start_websocket_connection());
    } else pause();

  }, [isAuthenticated]);

  useEffect(() => {
    isSocketRefreshNeeded && toast.error('Could not connect to the Server. Please Refresh your page.',
    {
      position: toast.POSITION.TOP_CENTER,
      autoClose: false
    });
  }, [isSocketRefreshNeeded]);

  const {
    start, pause/*, reset, resume, isIdle, isLeader, getRemainingTime, getElapsedTime, getLastIdleTime, getLastActiveTime, getTotalIdleTime, getTotalActiveTime*/
  } = useUserTrackerStatus();


  return (
    <main className={`${matches && drawerToggle ? `${classes.root} ${classes.drawerOpen}` : `${classes.root} ${classes.drawerClosed}`}`}>
      <CssBaseline />
      <RouteGuard>
        <>
          <Navbar navRef={navRef} />
          <MainDrawer navRef={navRef} />
          <ToastContainer
            position="top-center"
            autoClose={8000}
            hideProgressBar={false}
            newestOnTop={true}
            draggable={false}
            closeOnClick
          />
          <Component {...pageProps} />
        </>
      </RouteGuard>
    </main>
  );
}

export default Main;