import { CustomTheme } from '@mui/material';
import { CSSProperties } from 'react';
import { makeStyles } from 'tss-react/mui';

export const usePageStyles = (additionalProps?: CSSProperties) => {
    return makeStyles<{ additionalProps?: CSSProperties }>()((_, { additionalProps }) => ({
        root: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            ...additionalProps
        }
    }))({ additionalProps });
}

