import React, { useState } from 'react';
import { Paper } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import WithResultsSearch from '../../../hoc/WithResultsSearch';
import { getChatRoomMembers } from '../../../../api/chat';
import '../../drawer.css';
import PropTypes from 'prop-types';
import SearchedUser from './SearchedUser';
import { getPublicUser } from '../../../../selectors/user';
import { connect } from 'react-redux';
import { VIEW_TYPE_POPPER, NEW_DM } from '../../../../types/dm';
import {
  AppNotificationPropTypes,
  ERROR,
} from '../../../../types/notification';
import { PublicUserPropTypes } from '../../../../types/user';
import SearchUsers from '../../../common/SearchUsers';
import SearchUserResults from '../../../common/SearchUserResults';
import { useDMLoadFromParticipants } from '../../../../hooks/useDMLoad';

const useStyles = makeStyles((theme) => ({
  search: {
    height: '60vh',
    width: '60vh',
    display: 'flex',
    flexDirection: 'column',
  },
}));

const NewDM = ({
  fetched,
  getResults,
  resetFilter,
  searchOnNewFilter,
  publicUser,
}) => {
  const classes = useStyles();

  const [startDM, setStartDM] = useState({ participants: null, enable: false });
  const {
    data: dmData,
    error: dmError,
    isLoading: dmLoading,
    remove,
  } = useDMLoadFromParticipants(
    startDM.participants,
    VIEW_TYPE_POPPER,
    startDM.enable
  );

  const loadDM = (recipient) => {
    setStartDM({ participants: [publicUser, recipient], enable: true });
  };

  const resetError = () => {
    remove();
    setStartDM({ participants: null, enable: false });
  };

  return (
    <Paper className={classes.search} elevation={4}>
      <SearchUsers runOnSearch={searchOnNewFilter} />
      <SearchedUser
        searchedUser={{
          username: 'testUser',
          uid: 'xQOjcbpfY1ZJdR0XPDBSyxMsyfU2',
        }}
        loadDM={loadDM}
      />
      <SearchUserResults
        fetched={fetched}
        loadingDM={dmLoading}
        getResults={getResults}
        loadDM={loadDM}
        error={dmError ? true : false}
        resetError={resetError}
      />
    </Paper>
  );
};

NewDM.propTypes = {
  fetched: PropTypes.object.isRequired,
  getResults: PropTypes.func.isRequired,
  resetFilter: PropTypes.func.isRequired,
  searchOnNewFilter: PropTypes.func.isRequired,
  publicUser: PublicUserPropTypes.isRequired,
};

const mapStateToProps = (state) => ({
  publicUser: getPublicUser(state),
});

export default connect(mapStateToProps)(
  WithResultsSearch(NewDM, getChatRoomMembers, null, NEW_DM)
);
