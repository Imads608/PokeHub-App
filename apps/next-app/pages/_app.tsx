/*import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Welcome to next-app!</title>
      </Head>
      <div className="app">
        <header className="flex">
          {/* eslint-disable-next-line @next/next/no-img-element */ /*}
          <img src="/nx-logo-white.svg" alt="Nx logo" width="75" height="50" />
          <h1>Welcome to next-app!</h1>
        </header>
        <main>
          <Component {...pageProps} />
        </main>
      </div>
    </>
  );
}

export default CustomApp;
*/
import React, { FC, useEffect, useRef } from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { RootState, wrapper } from '../store/store';
import '../styles/global.scss';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import Navbar from '../components/nav/navbar';
import { QueryClientProvider } from 'react-query';
import queryClient from '../queryClient';
import { getDesignTokens } from '../styles/mui/themes/theme';
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
import Router from 'next/router';
import NProgress from 'nprogress';
import RouteGuard from '../components/auth/guards/routeGuard';
import MainDrawer from '../components/drawer/mainDrawer';
import { getDrawerToggle } from '../store/selectors/drawer';

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

  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

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
  const res = useLoadUser(
    typeof window !== 'undefined'
      ? localStorage.getItem('pokehub-refresh-token')
      : null
  );
  const navRef = useRef(null);
  const drawerToggle: boolean = useSelector<RootState, boolean>(getDrawerToggle);
  const matches = useMediaQuery(theme.breakpoints.up('md'));

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