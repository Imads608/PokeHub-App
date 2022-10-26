import React, { useEffect, useRef } from 'react';
import { RootState, wrapper } from '../store/store';
import '../styles/global.scss';
import { ThemeProvider } from '@mui/material/styles';
import Navbar from '../components/nav/navbar';
import { QueryClientProvider } from 'react-query';
import queryClient from '../queryClient';
import { getRootDesignTokens } from '../styles/mui/themes/theme';
import createEmotionCache from '../styles/mui/createEmotionCache';
import { CacheProvider } from '@emotion/react';
import { Hydrate } from 'react-query/hydration';
import useLoadUser from '../hooks/auth/useLoadUser';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CssBaseline, PaletteMode, useMediaQuery } from '@mui/material';
import { getPaletteTheme } from '../store/selectors/app';
import { useSelector } from 'react-redux';
import { createTheme } from '@mui/material/styles';
import { CustomTheme } from '@mui/material';
import Router from 'next/router';
import NProgress from 'nprogress';
import RouteGuard from '../components/auth/guards/routeGuard';
import MainDrawer from '../components/drawer/mainDrawer';
import { getDrawerToggle } from '../store/selectors/drawer';
import { getIsAuthenticated, getAuthLoading, getInitialAccessToken } from '../store/selectors/auth';
import { getUsersNSClientId, getUser, getUserStatus, getIsRefreshNeeded } from '../store/selectors/user';
import { IUserData, Status, IUserStatusData } from '@pokehub/user/interfaces';
import { useIdleTimer } from 'react-idle-timer';
import { start_websocket_connection, status_update } from '../store/reducers/user';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import http from '../axios';

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
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getPaletteTheme);

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
  const navRef: React.MutableRefObject<HTMLButtonElement> = useRef(null);
  const drawerToggle: boolean = useSelector<RootState, boolean>(getDrawerToggle);
  const isAuthenticated: boolean = useSelector<RootState, boolean>(getIsAuthenticated);
  const authLoading: boolean = useSelector<RootState, boolean>(getAuthLoading);
  const user = useSelector<RootState, IUserData>(getUser);
  const socketId = useSelector<RootState, string>(getUsersNSClientId);
  const isSocketRefreshNeeded = useSelector<RootState, boolean>(getIsRefreshNeeded);
  const userStatus = useSelector<RootState, IUserStatusData>(getUserStatus);
  const initialAccessToken = useSelector<RootState, string>(getInitialAccessToken);
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const res = useLoadUser(null, !isAuthenticated && authLoading)
  const dispatch = useDispatch();
  let lastSeen: Date = new Date();

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

  const onActive = (e: Event) => {
    console.log('onActive: Hit');
    if (userStatus.state != Status.APPEAR_AWAY && userStatus.state != Status.APPEAR_BUSY && userStatus.state != Status.APPEAR_OFFLINE) {
      console.log('onActive: Sending update');
      lastSeen = new Date();
      dispatch(status_update({ lastSeen: new Date(), state: Status.ONLINE, uid: user.uid, id: userStatus.id, username: user.username, socketId, isHardUpdate: false }));
    }
  }

  const onIdle = (e: Event) => {
    console.log('onIdle: Hit');
    if (userStatus.state != Status.APPEAR_AWAY && userStatus.state != Status.APPEAR_BUSY && userStatus.state != Status.APPEAR_OFFLINE) {
      console.log('onIdle: Sending update');
      lastSeen = new Date();
      dispatch(status_update({ lastSeen: new Date(), state: Status.AWAY, id: userStatus.id, uid: user.uid, username: user.username, socketId, isHardUpdate: false }));
    }
  }

  const onAction = (e: Event) => {
    const diffMilliseconds = (new Date()).valueOf() - lastSeen.valueOf();
    
    if (diffMilliseconds >= 1000*60*5 && userStatus.state != Status.APPEAR_AWAY && userStatus.state != Status.APPEAR_BUSY && userStatus.state != Status.APPEAR_OFFLINE) {
      console.log('onAction: Sending update');
      lastSeen = new Date();
      dispatch(status_update({ lastSeen: new Date(), state: Status.ONLINE, id: userStatus.id, uid: user.uid, username: user.username, socketId, isHardUpdate: false }));
    }
  }

  const {
    start, reset, pause, resume, isIdle, isLeader, getRemainingTime, getElapsedTime, getLastIdleTime, getLastActiveTime, getTotalIdleTime,
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
