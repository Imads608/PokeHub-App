import React from 'react';
import { connect } from 'react-redux';
import Loading from '../layout/Loading';
import { Link } from 'react-router-dom';
import TrainerCard from './TrainerCard';
import { getUser } from '../../selectors/user';
import { UserPropTypes } from '../../types/user';
import { DASHBOARD } from '../../types/app';
import useInitialLoad from '../../hooks/useInitialLoad';
import { Button } from '@mui/material';
import './dashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import UsefulLinks from './UsefulLinks';

const Dashboard = ({ user }) => {
  const { isLoading } = useInitialLoad(DASHBOARD, null);

  return isLoading ? (
    <Loading />
  ) : (
    <main
      style={{
        backgroundColor: 'pink',
        height: '93vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ margin: '20px' }}>
        <TrainerCard user={user} />
      </div>
      <UsefulLinks />
    </main>
  );
};

Dashboard.propTypes = {
  user: UserPropTypes.isRequired,
};

const mapStateToProps = (state) => ({
  user: getUser(state),
});

export default connect(mapStateToProps, null)(Dashboard);
