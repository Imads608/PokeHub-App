import React from 'react';
import { ListItemText, ListItem } from '@mui/material';
import { Hidden } from '@mui/material';
import '../../drawer.css';
import { Link } from 'react-router-dom';
import { Avatar } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { connect } from 'react-redux';
import { openedDM, closedDM, setDMInactive } from '../../../../actions/chat';
import CancelIcon from '@mui/icons-material/Cancel';
import PropTypes from 'prop-types';
import Badge from '@mui/material/Badge';
import { DMPropTypes } from '../../../../types/dm';
import { setDMToInactive } from '../../../../middleware-thunks/chat';
import { getUsername } from '../../../../selectors/user';

const useStyles = makeStyles((theme) => ({
  small: {
    width: theme.spacing(3),
    height: theme.spacing(3),
  },
  closeIcon: {
    color: 'rgb(171, 2, 64)',
    marginRight: '5px',
    cursor: 'pointer',
    '&:hover': {
      color: 'red',
    },
  },
}));

const DMLink = ({
  currentDM,
  dm,
  setDMtoInactive,
  classes,
  openDM,
  username,
}) => {
  return (
    <ListItem
      button
      component={Link}
      selected={currentDM && dm.id === currentDM.id}
      to={`/dms/${dm.id}`}
      onClick={openDM}
    >
      <CancelIcon
        fontSize="small"
        className={classes.closeIcon}
        onClick={setDMtoInactive}
      />
      <Badge badgeContent={dm.state.unread} color="primary">
        <Avatar
          style={{ marginRight: '10px' }}
          className={classes.small}
          src="/broken-image.jpg"
        />
      </Badge>
      <ListItemText
        primary={
          <h5
            className={`drawer-header-text drawer-expanded-list-item-text drawer-header`}
          >
            {username === dm.participants[1].username
              ? dm.participants[0].username
              : dm.participants[1].username}
          </h5>
        }
      />
    </ListItem>
  );
};

const DMNonLink = ({
  currentDM,
  dm,
  setDMtoInactive,
  classes,
  openDM,
  username,
}) => {
  return (
    <ListItem
      button
      selected={currentDM && dm.id === currentDM.id}
      onClick={openDM}
      className="drawer-expanded-list-item"
    >
      <CancelIcon
        fontSize="small"
        className={classes.closeIcon}
        onClick={setDMtoInactive}
      />
      <Badge badgeContent={dm.state.unread} color="primary">
        <Avatar
          style={{ marginRight: '10px' }}
          className={classes.small}
          src="/broken-image.jpg"
        />
      </Badge>
      <ListItemText
        primary={
          <h5
            className={`drawer-header-text drawer-expanded-list-item-text drawer-header`}
          >
            {username === dm.participants[1].username
              ? dm.participants[0].username
              : dm.participants[1].username}
          </h5>
        }
      />
    </ListItem>
  );
};

const DMItem = ({
  dm,
  openedDM,
  currentDM,
  closedDM,
  setDMInactive,
  username,
}) => {
  const classes = useStyles();

  const openDM = (e) => {
    e.stopPropagation();
    openedDM(dm.id);
  };

  const setDMtoInactive = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setDMInactive(dm.id);
  };

  return (
    <div>
      <Hidden mdDown>
        {dm.state.viewType === 'POPPER' ? (
          <DMNonLink
            username={username}
            dm={dm}
            currentDM={currentDM}
            setDMtoInactive={setDMtoInactive}
            classes={classes}
            openDM={openDM}
          />
        ) : (
          <DMLink
            username={username}
            dm={dm}
            currentDM={currentDM}
            setDMtoInactive={setDMtoInactive}
            classes={classes}
            openDM={openDM}
          />
        )}
      </Hidden>
      <Hidden mdUp>
        <DMLink
          username={username}
          dm={dm}
          currentDM={currentDM}
          setDMtoInactive={setDMtoInactive}
          classes={classes}
          openDM={openDM}
        />
      </Hidden>
    </div>
  );
};

DMItem.propTypes = {
  dm: DMPropTypes.isRequired,
  openedDM: PropTypes.func.isRequired,
  currentDM: PropTypes.object,
  username: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  username: getUsername(state),
});

export default connect(mapStateToProps, { openedDM, closedDM, setDMInactive })(
  DMItem
);
