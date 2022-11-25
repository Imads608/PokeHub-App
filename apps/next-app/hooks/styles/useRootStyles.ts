import { makeStyles } from 'tss-react/mui';

export const useRootStyles = () => {
    return makeStyles()(() => ({
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
