import { CustomTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

export const useLocalStyles = makeStyles()((theme: CustomTheme) => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        height: '100%',
        backgroundColor: theme.palette.background.default,
        padding: '0 15px',
        position: 'fixed',
        top: 0,
        right: 0,
    },
    item: {
        color: 'transparent',
        transition: 'ease-in transform 0.2s', /* Animation */
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        '&:hover': {
            color: 'inherit',
            cursor: 'pointer',
            transform: 'scale(1.2)',
        }
    },
}));