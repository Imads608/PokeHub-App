import { CustomTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

export const useChatRoomsSectionStyles = () => {
    return makeStyles()((theme: CustomTheme) => ({
        root: {
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            'transitionTimingFunction': 'ease-in-out',
            transition: 'width 0.2s'
        },
        drawerClosed: {
            width: '100%',
        },
        drawerOpen: {
            'width': '85%',
        }
    }))();
};
