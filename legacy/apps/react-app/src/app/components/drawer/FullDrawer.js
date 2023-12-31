import React, { useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { connect } from 'react-redux';
import { closedDrawer } from '../../actions/drawer';
import PropTypes from 'prop-types';
import DrawerItems from './DrawerItems';

const FullDrawer = ({ drawerToggle, closedDrawer, classes, drawerRef }) => {
  const theme = useTheme();
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
        <IconButton onClick={() => closedDrawer()} size="large">
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

FullDrawer.propTypes = {
  drawerToggle: PropTypes.bool.isRequired,
  closedDrawer: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  drawerToggle: state.app.drawerToggle,
});

export default connect(null, { closedDrawer })(FullDrawer);
