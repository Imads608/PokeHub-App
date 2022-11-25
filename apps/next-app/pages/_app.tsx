import React, { useEffect } from 'react';
import { RootState, wrapper } from '../store/store';
import '../styles/global.scss';
import { ThemeProvider } from '@mui/material/styles';
import { DehydratedState, QueryClientProvider } from 'react-query';
import queryClient from '../queryClient';
import { getAppRootDesignTokens } from '../styles/mui/themes/theme';
import { CacheProvider, EmotionCache } from '@emotion/react';
import { Hydrate } from 'react-query/hydration';
import 'react-toastify/dist/ReactToastify.css';
import { PaletteMode } from '@mui/material';
import { getPaletteTheme } from '../store/selectors/app';
import { useSelector } from 'react-redux';
import { createTheme } from '@mui/material/styles';
import { CustomTheme } from '@mui/material';
import { AppProps } from 'next/app';
import Main from '../components/main';
import { initApp } from '../init/initialization';

const { emotionCache: clientSideEmotionCache } = initApp();

interface WrappedAppProps extends AppProps<{ dehydratedState: DehydratedState }> {
  emotionCache: EmotionCache;
}

const WrappedApp = (props: WrappedAppProps) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const mode: PaletteMode = useSelector<RootState, PaletteMode>(getPaletteTheme);

  const theme: CustomTheme = React.useMemo((): CustomTheme => createTheme(getAppRootDesignTokens(mode)), [mode]);

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
            <Main
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

export default wrapper.withRedux(WrappedApp);
