import React, { FC, useEffect, useRef } from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { RootState, wrapper } from '../store/store';
import '../styles/global.scss';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import Navbar from '../components/nav/navbar';
import { QueryClientProvider } from 'react-query';
import queryClient from '../queryClient';
import { getRootDesignTokens, getMainAppDesignTokens } from '../styles/mui/themes/theme';
import createEmotionCache from '../styles/mui/createEmotionCache';
import { CacheProvider } from '@emotion/react';
import { Hydrate } from 'react-query/hydration';
import useLoadUser from '../hooks/auth/useLoadUser';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CssBaseline, PaletteMode, useMediaQuery } from '@mui/material';
import { getAppTheme } from '../store/selectors/app';
import { useSelector } from 'react-redux';
import { createTheme } from '@mui/material/styles';
import { CustomTheme } from '@mui/material';
import Router from 'next/router';
import NProgress from 'nprogress';
import RouteGuard from '../components/auth/guards/routeGuard';
import MainDrawer from '../components/drawer/mainDrawer';
import { getDrawerToggle } from '../store/selectors/drawer';
import { getIsAuthenticated, getAuthLoading } from '../store/selectors/auth';
import { getSocketId, getUser, getUserStatus } from '../store/selectors/user';
import { IUserData, Status, IUserStatusData } from '@pokehub/user/interfaces';
import { IUserEventMessage, UserSocketEvents } from '@pokehub/event/user';
import { sendUserStatusMessage } from '../events/user/user-events';
import { socket } from '../events/socket';
import { useIdleTimer } from 'react-idle-timer';
import { status_update } from '../store/reducers/user';
import { useDispatch } from 'react-redux';

// Router Page Navigation Progress Bar
NProgress.configure({ showSpinner: false });

Router.events.on('routeChangeStart', () => {
  NProgress.start();
});

Router.events.on('routeChangeComplete', () => {
  NProgress.done();
});

Router.events.on('routeChangeError', () => {
  NProgress.done();
});

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

const WrappedApp = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getAppTheme);

  const theme: CustomTheme = React.useMemo((): CustomTheme => createTheme(getRootDesignTokens(mode)), [mode]);

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <Hydrate state={pageProps.dehydratedState}>
            <MainApp
              Component={Component}
              pageProps={pageProps}
              theme={theme}
            />
          </Hydrate>
        </QueryClientProvider>
      </ThemeProvider>
    </CacheProvider>
  );
};

const MainApp = ({ Component, pageProps, theme }) => {
  const navRef = useRef(null);
  const drawerToggle: boolean = useSelector<RootState, boolean>(getDrawerToggle);
  const isAuthenticated: boolean = useSelector<RootState, boolean>(getIsAuthenticated);
  const authLoading: boolean = useSelector<RootState, boolean>(getAuthLoading);
  const user = useSelector<RootState, IUserData>(getUser);
  const socketId = useSelector<RootState, string>(getSocketId);
  const userStatus = useSelector<RootState, IUserStatusData>(getUserStatus);
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const res = useLoadUser(null, !isAuthenticated && authLoading)
  const dispatch = useDispatch();
  let lastSeen: Date = new Date();

  useEffect(() => {
    if (isAuthenticated) {
      start();
    } else pause();

  }, [isAuthenticated]);

  const onActive = (e: Event) => {
    console.log('onActive: Hit');
    if (userStatus.status != Status.APPEAR_AWAY && userStatus.status != Status.APPEAR_BUSY && userStatus.status != Status.APPEAR_OFFLINE) {
      console.log('onActive: Sending update');
      lastSeen = new Date();
      dispatch(status_update({ lastSeen: new Date(), status: Status.ONLINE, uid: user.uid, username: user.username, socketId }));
    }
  }

  const onIdle = (e: Event) => {
    console.log('onIdle: Hit');
    if (userStatus.status != Status.APPEAR_AWAY && userStatus.status != Status.APPEAR_BUSY && userStatus.status != Status.APPEAR_OFFLINE) {
      console.log('onIdle: Sending update');
      lastSeen = new Date();
      dispatch(status_update({ lastSeen: new Date(), status: Status.AWAY, uid: user.uid, username: user.username, socketId }));
    }
  }

  const onAction = (e: Event) => {
    const diffMilliseconds = (new Date()).valueOf() - lastSeen.valueOf();
    
    if (diffMilliseconds >= 1000*60*5 && userStatus.status != Status.APPEAR_AWAY && userStatus.status != Status.APPEAR_BUSY && userStatus.status != Status.APPEAR_OFFLINE) {
      console.log('onAction: Sending update');
      lastSeen = new Date();
      dispatch(status_update({ lastSeen: new Date(), status: Status.ONLINE, uid: user.uid, username: user.username, socketId }));
    }
  }

  const {
    start,
    reset,
    pause,
    resume,
    isIdle,
    isLeader,
    getRemainingTime,
    getElapsedTime,
    getLastIdleTime,
    getLastActiveTime,
    getTotalIdleTime,
    getTotalActiveTime
  } = useIdleTimer({ onActive, onIdle, onAction, timeout: 1000 * 60 * 5,
    events: [
      'mousemove',
      'keydown',
      'wheel',
      'DOMMouseScroll',
      'mousewheel',
      'mousedown',
      'touchstart',
      'touchmove',
      'MSPointerDown',
      'MSPointerMove',
      'visibilitychange'
    ],
    debounce: 0,
    throttle: 0,
    eventsThrottle: 200,
    startOnMount: false,
    startManually: true,
    stopOnIdle: false,
    crossTab: false
  });


  return (
    <main className={`${matches && drawerToggle ? 'full-drawer-open' : ''}`}>
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
};

export default wrapper.withRedux(WrappedApp);
