import React from 'react';
import Drawer from '@mui/material/Drawer';
import { makeStyles } from 'tss-react/mui';

const useLocalStyles = makeStyles()(() => ({
    root: {
        width: '10%',
        flexShrink: 0,
    },
    paper: {
        maxWidth: '10%'
    }
}));

interface MobileDrawerProps {
    drawerRef: React.MutableRefObject<HTMLDivElement>;
}


const MobileDrawer = ({ drawerRef }: MobileDrawerProps) => {
    const { classes } = useLocalStyles();

    return (
        <Drawer
        className={classes.root}
        ref={drawerRef}
        variant="persistent"
        anchor="right"
        open={true}
        classes={{
            paper: classes.paper,
        }}
        >
            <div>
                Drawer Items
            </div>
        </Drawer>
    );
};

export default MobileDrawer;
