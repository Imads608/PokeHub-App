import { CustomTheme } from '@mui/material';
import { CSSProperties } from 'react';
import { makeStyles } from 'tss-react/mui';

export const usePageStyles = (additionalProps?: CSSProperties) => {
    return makeStyles<{ additionalProps?: CSSProperties }>()((theme: CustomTheme, { additionalProps }) => ({
        root: {
            height: '93vh',
            display: 'flex',
            flexDirection: 'column',
            ...additionalProps
        }
    }))({ additionalProps });
}

