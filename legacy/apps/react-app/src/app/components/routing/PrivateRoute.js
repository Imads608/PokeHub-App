import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getChatRooms } from '../../middleware-thunks/chat';
import Loading from '../layout/Loading';

const PrivateRoute = ({
  component: Component,
  auth: { isAuthenticated, loading },
  ...rest
}) => (
  <Route
    {...rest}
    render={(props) =>
      loading ? (
        <Loading />
      ) : !isAuthenticated && !loading ? (
        <Redirect
          to={{ pathname: '/login', state: { from: props.location } }}
        />
      ) : (
        <Component {...props} />
      )
    }
  />
);

/*
class PrivateRoute extends React.Component {
    componentDidMount() {
        console.log('Chat Rooms', this.props.component);
        if (this.props.chat.rooms === null) {
            console.log('Private Route fetching chat rooms')
            this.props.getChatRooms();
        }
    }

    render() {
        const { component: Component, auth: { isAuthenticated}, app: { loading }, chat: { opened }, ...rest } = this.props;

        return (
            <Route {...rest} render={props => !isAuthenticated && !loading ? 
                (<Redirect to='/login' />) :
                 <Component {...props} />}/>
        )
    }
}*/

PrivateRoute.propTypes = {
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps, { getChatRooms })(PrivateRoute);
