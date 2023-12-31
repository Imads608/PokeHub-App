import { makeStyles } from 'tss-react/mui';

export const useRootStyles = () => {
    return makeStyles()(() => ({
        root: {
            height: '100vh',
        }
    }))();
};
