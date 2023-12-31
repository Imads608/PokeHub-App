import { CustomThemeOptions, PaletteMode } from '@mui/material';
import {} from './theme.d';

export const getRootDesignTokens = (mode: PaletteMode): CustomThemeOptions => {
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