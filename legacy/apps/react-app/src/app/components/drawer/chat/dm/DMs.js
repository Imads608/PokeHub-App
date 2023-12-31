import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { getDMsToggle } from '../../../../selectors/drawer';
import { openedDMs, closedDMs } from '../../../../actions/drawer';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import { List, ListItemText } from '@mui/material';
import { Accordion, AccordionSummary } from '../../../custom/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChatIcon from '@mui/icons-material/Chat';
import Popper from '@mui/material/Popper';
import { Grow } from '@mui/material';
import { Hidden } from '@mui/material';
import NewDM from './NewDM';
import '../../drawer.css';
import {
  getActiveDMs,
  getOpenedDM,
  getTotalUnreadDMs,
} from '../../../../selectors/chat';
import { getDrawerToggle } from '../../../../selectors/drawer';
import DMItem from './DMItem';
import DM from './DM';
import { withRouter } from 'react-router-dom';
import { closedDM } from '../../../../actions/chat';
import NewDMToggle from './NewDMToggle';
import Badge from '@mui/material/Badge';
import {
  DMPropTypes,
  VIEW_TYPE_LINK,
  VIEW_TYPE_POPPER,
} from '../../../../types/dm';
import { useLocation } from 'react-router-dom';

const useStyles = makeStyles({
  headerBlock: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  closeIcon: {
    fontSize: 'medium',
    color: 'rgb(171, 2, 64)',
    marginRight: '5px',
    cursor: 'pointer',
    '&:hover': {
      color: 'red',
    },
  },
});

const DMs = ({
  dmsToggle,
  openedDMs,
  closedDMs,
  activeDMs,
  currentDM,
  drawerRef,
  closedDM,
  unreadTotalCount,
  drawerToggle,
}) => {
  const classes = useStyles();
  const [toggleNewDM, setToggleNewDM] = React.useState(false);
  const [drawerRefAvailable, setDrawerRefAvailable] = React.useState(false);
  const childPopper = useRef(null);
  const location = useLocation();

  useEffect(() => {
    currentDM && toggleNewDM && setToggleNewDM(false);
    (!drawerRefAvailable && drawerRef.current && setDrawerRefAvailable(true)) ||
      (drawerRefAvailable &&
        !drawerRef.current &&
        setDrawerRefAvailable(false));
    toggleNewDM && !drawerToggle && setToggleNewDM(false);
    //!drawerRefAvailable && drawerRef.current ? setDrawerRefAvailable(true) : drawerRefAvailable && !drawerRef.current ? setDrawerRefAvailable(false)
    currentDM && !drawerRef.current && closedDM(currentDM.id);
    currentDM &&
      currentDM.state.viewType === VIEW_TYPE_LINK &&
      !location.pathname.includes('/dms') &&
      !location.pathname.includes(currentDM.id) &&
      closedDM(currentDM.id);
  }, [currentDM, drawerRef, drawerToggle, location]);

  const toggleDMs = (e) => {
    if (!dmsToggle) {
      openedDMs();
    } else {
      closedDMs();
    }
  };

  const startNewDM = (e) => {
    currentDM &&
      currentDM.state.viewType === VIEW_TYPE_POPPER &&
      closedDM(currentDM.id);
    setToggleNewDM(!toggleNewDM);
  };

  return (
    <React.Fragment>
      <Accordion expanded={dmsToggle} onChange={() => toggleDMs()}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <List className={classes.headerBlock}>
            <Badge badgeContent={unreadTotalCount} color="primary">
              <ChatIcon
                fontSize="large"
                className={`drawer-icon ${
                  dmsToggle ? 'drawer-header-expanded' : 'drawer-header'
                }`}
              />
            </Badge>
            <ListItemText
              primary={
                <h4
                  className={`drawer-header-text ${
                    dmsToggle ? 'drawer-header-expanded' : 'drawer-header'
                  }`}
                >
                  DMs
                </h4>
              }
            />
          </List>
        </AccordionSummary>
        <AccordionDetails className="drawer-accordion-details">
          <List className="drawer-expanded-list">
            <NewDMToggle
              toggleNewDM={toggleNewDM}
              startNewDM={startNewDM}
              location={location}
            />
            {activeDMs &&
              activeDMs.map((dm, index) => (
                <DMItem key={index} dm={dm} currentDM={currentDM} />
              ))}
          </List>
        </AccordionDetails>
      </Accordion>
      <Hidden mdDown>
        <Popper
          modifiers={[
            { name: 'offset', enabled: true, options: { offset: [13, 25] } },
            {
              name: 'arrow',
              enabled: false,
              options: { element: childPopper.current },
            },
          ]}
          open={toggleNewDM && drawerRefAvailable}
          anchorEl={drawerRef && drawerRef.current ? drawerRef.current : null}
          placement="bottom-end"
          transition
        >
          {({ TransitionProps }) => (
            <Grow
              mountOnEnter
              unmountOnExit
              {...TransitionProps}
              in={toggleNewDM}
              timeout={500}
            >
              {toggleNewDM ? (
                <div ref={childPopper}>
                  <NewDM />
                </div>
              ) : (
                <div></div>
              )}
            </Grow>
          )}
        </Popper>
        <Popper
          modifiers={[
            { name: 'offset', enabled: true, options: { offset: [13, 25] } },
            {
              name: 'arrow',
              enabled: false,
              options: { element: childPopper.current },
            },
          ]}
          open={
            currentDM !== null &&
            drawerRefAvailable &&
            currentDM.state.viewType ===
              VIEW_TYPE_POPPER /*urlDMId !== currentDM.id && !urlDMId.includes('dms')*/
          }
          anchorEl={drawerRef && drawerRef.current ? drawerRef.current : null}
          placement="bottom-end"
          transition
        >
          {({ TransitionProps }) => (
            <Grow
              mountOnEnter
              unmountOnExit
              {...TransitionProps}
              in={currentDM !== null}
              timeout={500}
            >
              {currentDM ? (
                <div ref={childPopper}>
                  <DM />
                </div>
              ) : (
                <div></div>
              )}
            </Grow>
          )}
        </Popper>
      </Hidden>
    </React.Fragment>
  );
};

DMs.propTypes = {
  dmsToggle: PropTypes.bool.isRequired,
  activeDMs: PropTypes.arrayOf(DMPropTypes).isRequired,
  currentDM: DMPropTypes,
  drawerRef: PropTypes.object,
  unreadTotalCount: PropTypes.number.isRequired,
  openedDMs: PropTypes.func.isRequired,
  closedDMs: PropTypes.func.isRequired,
  closedDM: PropTypes.func.isRequired,
  drawerToggle: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({
  dmsToggle: getDMsToggle(state),
  activeDMs: getActiveDMs(state),
  currentDM: getOpenedDM(state),
  unreadTotalCount: getTotalUnreadDMs(state),
  drawerToggle: getDrawerToggle(state),
});

export default connect(mapStateToProps, { openedDMs, closedDMs, closedDM })(
  DMs
);
