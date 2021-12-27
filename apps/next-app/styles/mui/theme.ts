import { PaletteMode } from '@mui/material';

export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          type: 'light',
          primary: {
            main: '#f50057',
          },
          secondary: {
            main: '#3f51b5',
          },
        }
      : {
          // palette values for light mode
          type: 'dark',
          primary: {
            main: '#f50057', //'#1e1e25'
          },
          secondary: {
            main: '#3f51b5', //'#363637'
          },
        }),
  },
});

/*
// Create a theme instance.
const theme = createTheme({
    palette: {
        // palette values for light mode
        primary: {
            main: '#3f51b5'
        },
        secondary: {
            main: '#f50057'
        }
    }
});

export default theme;*/
