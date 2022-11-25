import { PaletteMode } from '@mui/material';
import { Theme, ThemeOptions } from '@mui/material/styles';
import { CustomPalette, CustomPaletteOptions } from '@mui/material/styles/createPalette';
import { CustomTypography, CustomTypographyOptions, Typography, TypographyOptions } from '@mui/material/styles/createTypography';

declare module '@mui/material/styles/createPalette' {
    interface CustomPalette extends Palette {
      fontTextOptions: {
          primary: {
              fontFamily: string,
          }
          secondary: {
              fontFamily: string,
          }
      }
    }
  
    interface CustomPaletteOptions extends PaletteOptions {
      fontTextOptions?: {
          primary?: {
              fontFamily?: string,
          }
          secondary?: {
              fontFamily?: string,
          }
      }
    }
}

declare module '@mui/material/styles/createTypography' {
    interface CustomTypography extends Typography {
        default: string;
    }

    interface CustomTypographyOptions extends TypographyOptions {
        default?: string;
    }
} 

declare module '@mui/material/styles' {
    interface CustomTheme extends Theme {
      palette: CustomPalette,
      typography: CustomTypography

    }
  
    interface CustomThemeOptions extends ThemeOptions {
      palette?: CustomPaletteOptions,
      typography?: CustomTypographyOptions
    }
    
    export function useTheme(): CustomTheme;
    export function createTheme(options?: CustomThemeOptions): CustomTheme;
}