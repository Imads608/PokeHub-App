import React from 'react';
import { connect } from 'react-redux';
import Loading from '../layout/Loading';
import { Link } from 'react-router-dom';
import TrainerCard from './TrainerCard';
import { getUser } from '../../selectors/user';
import { UserPropTypes } from '../../types/user';
import { DASHBOARD } from '../../types/app';
import useInitialLoad from '../../hooks/useInitialLoad';

const Dashboard = ({ user }) => {
    const { isLoading } = useInitialLoad(DASHBOARD, null);
        
    return (
        isLoading ? <Loading /> :
        <div style={{backgroundColor: 'pink', height: '93vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ margin: '20px' }}>
                <TrainerCard user={user} />
            </div>
            <Link to='/chatrooms'>To Chat Rooms</Link>
            <Link to='/dms'>To DMs</Link>
            <Link to='/dex'>To Dex</Link>
        </div>
    )
    
}

Dashboard.propTypes = {
    user: UserPropTypes.isRequired
}

const mapStateToProps = (state) => ({
    user: getUser(state)
})

export default connect(mapStateToProps, null)(Dashboard);