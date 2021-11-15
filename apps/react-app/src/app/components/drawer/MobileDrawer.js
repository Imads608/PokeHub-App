import React from 'react';
import { useTheme } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { connect } from 'react-redux';
import { closedDrawer } from '../../actions/drawer';
import PropTypes from 'prop-types';
import DrawerItems from './DrawerItems';

const MobileDrawer = ({ drawerToggle, closedDrawer, classes }) => {
    const theme = useTheme();

    const open = true;
    return (
        <Drawer
            variant="temporary"
            anchor='right'
            open={drawerToggle}
            hideBackdrop={false}
            classes={{
                paper: classes.drawerPaper,
            }}
        >
            <div className={classes.drawerHeader}>
                <IconButton onClick={() => closedDrawer()} size="large">
                    {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
            </div>
            <DrawerItems />
        </Drawer>
    );
}

MobileDrawer.propTypes = {
  drawerToggle: PropTypes.bool.isRequired,
  drawerItems: PropTypes.object,
  closedDrawer: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired
}

export default connect(null, { closedDrawer })(MobileDrawer);