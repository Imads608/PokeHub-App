import React from 'react';
import { useTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
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
                <IconButton onClick={() => closedDrawer()}>
                    {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
            </div>
            <DrawerItems />
        </Drawer>
    )
}

MobileDrawer.propTypes = {
  drawerToggle: PropTypes.bool.isRequired,
  drawerItems: PropTypes.object,
  closedDrawer: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired
}

export default connect(null, { closedDrawer })(MobileDrawer);