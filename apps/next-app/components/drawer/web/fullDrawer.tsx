import React, { useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useDispatch, useSelector } from 'react-redux';
import { drawer_closed } from '../../../store/reducers/drawer';
import { Dispatch } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';
import { getDrawerToggle } from '../../../store/selectors/drawer';
import DrawerItems from '../items/drawerItems';

interface FullDrawerProps {
  classes: any;
  drawerRef: any;
}

const FullDrawer = ({ classes, drawerRef }: FullDrawerProps) => {
  const theme = useTheme();
  const dispatch: Dispatch = useDispatch();
  const drawerToggle: boolean = useSelector<RootState, boolean>(
    getDrawerToggle
  );
  //const drawerRef = useRef(null);

  return (
    <Drawer
      className={classes.drawer}
      variant="persistent"
      anchor="right"
      open={drawerToggle}
      classes={{
        paper: classes.drawerPaper,
      }}
    >
      <div className={classes.drawerHeader}>
        <IconButton onClick={() => dispatch(drawer_closed())} size="large">
          {theme.direction === 'rtl' ? (
            <ChevronLeftIcon />
          ) : (
            <ChevronRightIcon />
          )}
        </IconButton>
      </div>
      <DrawerItems drawerRef={drawerRef} />
    </Drawer>
  );
};

export default FullDrawer;
