import { CustomThemeOptions, PaletteMode } from '@mui/material';
import {} from './theme.d';

export const getAppRootDesignTokens = (mode: PaletteMode): CustomThemeOptions => {
  return {
    palette: {
      mode,
      primary: {
        main: '#f50057',
      },
      secondary: {
        main: '#3f51b5',
      },
    },
    typography: {
      fontFamily: "'Orbitron', sans-serif",
    }
  }
}

export const getAppMainDesignTokens = (mode: PaletteMode): CustomThemeOptions => {
  return {
    palette: {
      mode,
      primary: {
        main: '#c75171'
      },
      secondary: {
        main: '#3f51b5'
      },
      background: {
        default: 'white',
        paper: 'rgba(208,52,57,0.45)'
      }
    }
  }
}