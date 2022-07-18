import { CustomThemeOptions, PaletteMode } from '@mui/material';
import {} from './theme.d';

export const getRootDesignTokens = (mode: PaletteMode): CustomThemeOptions => ({
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
  typography: {
    fontFamily: "'Orbitron', sans-serif"
  }
});

export const getMainAppDesignTokens = (mode: PaletteMode): CustomThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          type: 'light',
          primary: {
            main: '#c75171',
          },
          secondary: {
            main: '#3f51b5',
          },
          background: {
            default: 'white',
            paper: 'rgba(208,52,57,0.45)'
          },
          backgroundOptions: {
            primary: {
              color: '#585b5c'
            },
            secondary: {
              color: 'rgba(208,52,57,0.45)'
            }
          },
          fontTextOptions: {
            primary: {
              fontFamily: "'Orbitron', sans-serif"
            }
          }
        }
      : {
          // palette values for light mode
          type: 'dark',
          primary: {
            main: '#585b5c', //'#1e1e25'
          },
          secondary: {
            main: '#363637', //'#363637'
          },
          background: {
            default: '#121212',
            paper: '#1e1e25'
          },
          backgroundOptions: {
            primary: {
              color: '#1e1e25'
            },
            secondary: {
              color: '#0F313B'
            }
          },
          fontTextOptions: {
            primary: {
              fontFamily: "'Orbitron', sans-serif"
            }
          }
        }),
  },
  typography: {
    fontFamily: "'Orbitron', sans-serif"
  }
});


export const getDashboardDesignTokens = (mode: PaletteMode): CustomThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          type: 'light',
          primary: {
            main: '#c75171',
          },
          secondary: {
            main: '#3f51b5',
          },
          background: {
            default: 'white',
            paper: 'rgba(208,52,57,0.45)'
          },
          backgroundOptions: {
            primary: {
              color: '#585b5c'
            },
            secondary: {
              color: 'rgba(208,52,57,0.45)'
            }
          },
          fontTextOptions: {
            primary: {
              fontFamily: "'Orbitron', sans-serif"
            }
          }
        }
      : {
          // palette values for light mode
          type: 'dark',
          primary: {
            main: '#585b5c', //'#1e1e25'
          },
          secondary: {
            main: '#363637', //'#363637'
          },
          background: {
            default: '#121212',
            paper: '#1e1e25'
          },
          backgroundOptions: {
            primary: {
              color: '#1e1e25'
            },
            secondary: {
              color: '#0F313B'
            }
          },
          fontTextOptions: {
            primary: {
              fontFamily: "'Orbitron', sans-serif"
            }
          }
        }),
  },
});