import React, { useEffect, useRef } from 'react';
import { RootState } from '../store/store';
import Navbar from './nav/navbar.component';
import useLoadUser from '../hooks/auth/load-user.hook';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CssBaseline } from '@mui/material';
import { useSelector } from 'react-redux';
import RouteGuard from './auth/guards/route-guard';
import { getIsAuthenticated, getAuthLoading } from '../store/auth/auth.selector';
import { start_websocket_connection } from '../store/user/user.reducer';
import { useDispatch } from 'react-redux';
import { useUserTrackerStatus } from '../hooks/user/user-status-tracker.hook';
import Drawer from './drawer/drawer.component';
import { getDrawerWidth } from '../store/drawer/drawer.selector';
import { AppProps } from 'next/app';
import { useRootStyles } from './main.styles';


export interface MainProps {
    Component: AppProps['Component'];
    pageProps: AppProps['pageProps'];
}

const Main = ({ Component, pageProps }: MainProps): JSX.Element => {
  const navRef: React.MutableRefObject<HTMLButtonElement> = useRef(null);
  const mobileDrawerRef: React.MutableRefObject<HTMLDivElement> = useRef(null);
  const isAuthenticated: boolean = useSelector<RootState, boolean>(getIsAuthenticated);
  const authLoading: boolean = useSelector<RootState, boolean>(getAuthLoading);
  const dispatch = useDispatch();
  const { classes } = useRootStyles();
  const drawerWidth = useSelector<RootState, number>(getDrawerWidth);

  useLoadUser(!isAuthenticated && authLoading)

  useEffect(() => {
    if (isAuthenticated) {
      start();
      dispatch(start_websocket_connection());
    } else pause();

  }, [isAuthenticated]);

  const { start, pause } = useUserTrackerStatus();

  return (
    <main className={classes.root}>
      <CssBaseline />
      <RouteGuard>
        <>
            <section style={{ width: `calc(100% - ${drawerWidth}px)` }}>
                <Navbar navRef={navRef} />
                <ToastContainer
                    position="top-center"
                    autoClose={8000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    draggable={false}
                    closeOnClick
                />
                <Component {...pageProps} />
            </section>
            <section>
                <Drawer drawerRef={mobileDrawerRef} />
            </section>
        </>
      </RouteGuard>
    </main>
  );
}

export default Main;