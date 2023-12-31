import React, { useEffect, useState } from 'react';
import WithResultsSearch from '../../hoc/WithResultsSearch';
import { getChatRoomMembers } from '../../../api/chat';
import '../../drawer/drawer.css';
import PropTypes from 'prop-types';
import SearchedUser from '../../drawer/chat/dm/SearchedUser';
import { getActiveDMs } from '../../../selectors/chat';
import { getPublicUser } from '../../../selectors/user';
import { connect } from 'react-redux';
import {
  DMPropTypes,
  VIEW_TYPE_LINK,
  VIEW_TYPE_POPPER,
} from '../../../types/dm';
import { NEW_DM } from '../../../types/app';
import { PublicUserPropTypes } from '../../../types/user';
import { Resizable } from 're-resizable';
import Hidden from '@mui/material/Hidden';
import SearchUsers from '../../common/SearchUsers';
import SearchUserResults from '../../common/SearchUserResults';
import useInitialLoad from '../../../hooks/useInitialLoad';
import '../chat.css';
import { openedDM } from '../../../actions/chat';
import { openedDrawer, openedDMs } from '../../../actions/drawer';
import { useDMLoadFromParticipants } from '../../../hooks/useDMLoad';

const NewDM = ({
  fetched,
  getResults,
  searchOnNewFilter,
  activeDMs,
  publicUser,
  history,
  openedDM,
  openedDMs,
  openedDrawer,
}) => {
  const [startDM, setStartDM] = useState({ participants: null, enable: false });

  const queryResults = useInitialLoad(NEW_DM, null);
  const {
    data: dmData,
    error: dmError,
    isLoading: dmLoading,
    remove,
  } = useDMLoadFromParticipants(
    startDM.participants,
    VIEW_TYPE_LINK,
    startDM.enable
  );

  const loadDM = (recipient) => {
    setStartDM({ participants: [publicUser, recipient], enable: true });
  };

  const resetError = () => {
    remove();
    setStartDM({ participants: null, enable: false });
  };

  const openDM = (dm) => {
    dm.state.viewType === VIEW_TYPE_POPPER &&
      openedDrawer() &&
      openedDMs() &&
      openedDM(dm.id);
    dm.state.viewType === VIEW_TYPE_LINK && openedDM(dm.id);
  };

  useEffect(() => {
    dmData &&
      dmData.state.viewType === VIEW_TYPE_LINK &&
      history.push(`/dms/${dmData.id}`);
  }, [dmData]);

  return (
    <div className="main-view" style={{ paddingTop: '5px' }}>
      <SearchUsers runOnSearch={searchOnNewFilter} />
      <Hidden mdDown>
        <h3 className="theme-text active-dms-header">Active DMs</h3>
        <Resizable
          className="active-dms-section"
          defaultSize={{
            width: '80%',
            height: 200,
          }}
          minHeight={100}
          maxHeight={400}
        >
          {activeDMs.map((dm) => (
            <SearchedUser
              key={dm.id}
              searchedUser={{
                username:
                  dm.participants[0].username === publicUser.username
                    ? dm.participants[1].username
                    : dm.participants[0].username,
                uid:
                  dm.participants[0].uid === publicUser.uid
                    ? dm.participants[1].uid
                    : dm.participants[0].uid,
              }}
              loadDM={() => openDM(dm)}
            />
          ))}
        </Resizable>
      </Hidden>
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
    </div>
  );
};

NewDM.propTypes = {
  fetched: PropTypes.object.isRequired,
  getResults: PropTypes.func.isRequired,
  searchOnNewFilter: PropTypes.func.isRequired,
  activeDMs: PropTypes.arrayOf(DMPropTypes).isRequired,
  publicUser: PublicUserPropTypes.isRequired,
  openedDM: PropTypes.func.isRequired,
  openedDMs: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  activeDMs: getActiveDMs(state),
  publicUser: getPublicUser(state),
});

export default connect(mapStateToProps, { openedDM, openedDMs, openedDrawer })(
  WithResultsSearch(NewDM, getChatRoomMembers, null, NEW_DM)
);
