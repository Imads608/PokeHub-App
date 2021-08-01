import React, { useRef } from 'react';
import { useTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
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
          <IconButton onClick={() => closedDrawer()}>
            {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </div>
        <DrawerItems drawerRef={drawerRef} />
      </Drawer>
  );
}

FullDrawer.propTypes = {
  drawerToggle: PropTypes.bool.isRequired,
  closedDrawer: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired
}

const mapStateToProps = (state) => ({
  drawerToggle: state.app.drawerToggle
})

export default connect(null, { closedDrawer })(FullDrawer);