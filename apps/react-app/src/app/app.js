/* eslint-disable react-hooks/exhaustive-deps */
import './index.css';
import Navbar from './components/layout/Navbar';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Landing from './components/layout/Landing';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import React, { useEffect, useRef } from 'react';
import { QueryClientProvider } from 'react-query';
import queryClient from './queryClient';
import { loadUser } from './middleware-thunks/auth';
import AlertNotification from './components/layout/AlertNotification';
import PrivateRoute from './components/routing/PrivateRoute';
import Dashboard from './components/dashboard/Dashboard'
import ChatRoom from './components/chat/room/ChatRoom';
import ChatRooms from './components/chat/room/ChatRooms';
import AppDrawer from './components/drawer/AppDrawer';
import Pokedex from './components/dex/Pokedex';

import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { connect, useDispatch, useSelector } from 'react-redux';
import { getDrawerToggle } from './selectors/drawer';
import NewDM from './components/chat/dm/NewDM';
import DM from './components/chat/dm/DM';
import useLoadUser from './hooks/useLoadUser';
import LoginNew from './components/auth/LoginNew';
import RegisterNew from './components/auth/RegisterNew';
import { getIsAuthenticated } from './selectors/auth';
import { userIsOnline } from './actions/user';
import { getPublicUser } from './selectors/user';
import { userEvents } from './events/types';
import { getMessageEvent } from './events/events/message';
import { getUserStatusEvent } from './events/events/user';
import { emitUserStatus } from './events/event-emitters/user';

const MainApp = ({ matches, drawerToggle }) => {
  const isAuthenticated = useSelector(getIsAuthenticated);
  const publicUser = useSelector(getPublicUser);
  const res = useLoadUser(localStorage.getItem('pokehub-refresh-token'));
  const dispatch = useDispatch();
  let interval = null;

  useEffect(() => {
    console.log('Its authenticated', isAuthenticated);
    interval && window.clearInterval(interval);
    if (isAuthenticated) {
      interval = setInterval(() => {
        const data = getUserStatusEvent(publicUser.uid, null, false);
        const message = getMessageEvent(userEvents.USER_STATUS, { uid: publicUser.uid, username: publicUser.username }, data);
        console.log('emitting user status');
        emitUserStatus(message);
        //dispatch(userIsOnline(publicUser.uid, publicUser.username));
      }, 30000);
    }
  }, [isAuthenticated]);

  return (
    <main
      className={`${matches && drawerToggle ? 'full-drawer-open' : ''}`}
    >
      <AlertNotification />

      <Switch>
        <Route exact path='/' component={Landing} />
        <Route path='/login' component={LoginNew} />
        <Route path='/register' component={RegisterNew} />
        <PrivateRoute exact path='/dashboard' component={Dashboard} />
        <PrivateRoute exact path='/chatrooms' component={ChatRooms} />
        <PrivateRoute path='/chatrooms/:id' component={ChatRoom} />
        <PrivateRoute exact path='/dms' component={NewDM} />
        <PrivateRoute path='/dms/:id' component={DM} />
        <PrivateRoute path='/dex' component={Pokedex} />
      </Switch>
    </main>
  )
}


const App = ({ loadUser, drawerToggle }) => {
  /*useEffect(() => {
    loadUser();//store.dispatch(loadUser());
  }, []);*/


  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const navbarRef = useRef(null);

  return (
        <Router>
          <QueryClientProvider client={queryClient}>
            <div>
              <Navbar navbarRef={navbarRef}/>
              <AppDrawer navbarRef={navbarRef} />
              <MainApp matches={matches} drawerToggle={drawerToggle} />
            </div>
          </QueryClientProvider>
        </Router>
    )
}

const mapStateToProps = (state) => ({
  drawerToggle: getDrawerToggle(state)
})

export default connect(mapStateToProps, { loadUser })(App);