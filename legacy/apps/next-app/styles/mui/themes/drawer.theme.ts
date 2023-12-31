import { CustomTheme, CustomThemeOptions, PaletteMode } from '@mui/material';
import {} from './theme.d';

export const getDrawerDesignTokens = (mode: PaletteMode, outerTheme: CustomTheme): CustomThemeOptions => {
  return {
    ...outerTheme,
    palette: {
      ...outerTheme.palette,
      mode,
      background: {
        default: mode === 'light' ? '#FF9494' : 'rgba(35, 32, 34, 0.8)',
      },
    },
    typography: {
      ...outerTheme.typography,
    }
  }
}