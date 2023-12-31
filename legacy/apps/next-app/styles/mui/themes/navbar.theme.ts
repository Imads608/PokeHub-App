import { CustomTheme, CustomThemeOptions, PaletteMode } from '@mui/material';
import {} from './theme.d';

export const getNavbarDesignTokens = (mode: PaletteMode, outerTheme: CustomTheme): CustomThemeOptions => {
  return {
    ...outerTheme,
    palette: {
      ...outerTheme.palette,
      mode,
      text: {
        primary: '#ffffff'
      }
    },
    typography: {
      ...outerTheme.typography,
      allVariants: {
        color: '#ffffff'
      },
    }
  }
}