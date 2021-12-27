import React from 'react';
import { useTheme } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { drawer_closed } from '../../../store/reducers/drawer';
import { Dispatch } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';
import { getDrawerToggle } from '../../../store/selectors/drawer';//import DrawerItems from './DrawerItems';
import { useDispatch, useSelector } from 'react-redux';
import DrawerItems from '../items/drawerItems';

interface MobileDrawerProps {
    classes: any
}

const MobileDrawer = ({ classes }: MobileDrawerProps) => {
    const theme = useTheme();
    const dispatch: Dispatch = useDispatch();
    const drawerToggle: boolean = useSelector<RootState, boolean>(getDrawerToggle);

    const open = true;
    return (
        <Drawer
            variant="temporary"
            anchor='right'
            open={drawerToggle}
            hideBackdrop={false}
            classes={{
                paper: classes.drawerPaper
            }}
        >
            <div className={classes.drawerHeader}>
                <IconButton onClick={() => dispatch(drawer_closed())} size="large">
                    {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
            </div>
            <DrawerItems drawerRef={null} />
        </Drawer>
    );
}

export default MobileDrawer;