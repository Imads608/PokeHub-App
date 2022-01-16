import { PaletteMode } from '@mui/material';
import { Theme, ThemeOptions } from '@mui/material/styles';
import { CustomPalette, CustomPaletteOptions } from '@mui/material/styles/createPalette';

declare module '@mui/material/styles/createPalette' {
    interface CustomPalette extends Palette {
      backgroundOptions: {
          primary: {
              color: string
          },
          secondary: {
              color: string
          }
      }
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
      backgroundOptions?: {
          primary?: {
              color?: string
          },
          secondary?: {
              color?: string
          }
      }
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
declare module '@mui/material/styles' {
    interface CustomTheme extends Theme {
      palette: CustomPalette
    }
  
    interface CustomThemeOptions extends ThemeOptions {
      palette: CustomPaletteOptions
    }
    
    export function useTheme(): CustomTheme;
    export function createTheme(options?: CustomThemeOptions): CustomTheme;
}