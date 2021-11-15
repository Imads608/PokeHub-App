import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './app/app';
import store from './app/store';
import { ThemeProvider, StyledEngineProvider, createTheme } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';

const theme = createTheme()

ReactDOM.render(
    <Provider store={store}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </StyledEngineProvider>
    </Provider>,
  document.getElementById('root')
);
