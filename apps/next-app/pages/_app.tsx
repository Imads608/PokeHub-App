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
          {/* eslint-disable-next-line @next/next/no-img-element *//*}
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
import React, {FC, useEffect} from 'react';
import {AppProps} from 'next/app';
import Head from 'next/head';
import {RootState, wrapper} from '../store/store';
import '../styles/global.scss';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import Navbar from '../components/nav/navbar';
import { QueryClientProvider } from 'react-query';
import queryClient from '../queryClient';
import { getDesignTokens } from '../styles/mui/theme';
import createEmotionCache from '../styles/mui/createEmotionCache';
import { CacheProvider } from '@emotion/react';
import { Hydrate } from 'react-query/hydration'
import useLoadUser from '../hooks/auth/useLoadUser';
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { PaletteMode } from '@mui/material';
import { getAppTheme } from '../store/selectors/app';
import { useSelector } from 'react-redux';
import { createTheme } from '@mui/material/styles';

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
              <MainApp Component={Component} pageProps={pageProps} />
            </Hydrate>
          </QueryClientProvider>
        </ThemeProvider>
    </CacheProvider>
  );
}

const MainApp = ({ Component, pageProps }) => {
  const res = useLoadUser(typeof window !== 'undefined' ? localStorage.getItem('pokehub-refresh-token') : null);

  return (
    <main>
      <Navbar />
      <ToastContainer 
        position='top-center'
        autoClose={8000}
        hideProgressBar={false}
        newestOnTop={true}
        draggable={false}
        closeOnClick
      />
      <Component {...pageProps} />
    </main>
  )
} 

export default wrapper.withRedux(WrappedApp);