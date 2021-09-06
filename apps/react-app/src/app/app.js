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
import { connect } from 'react-redux';
import { getDrawerToggle } from './selectors/drawer';
import NewDM from './components/chat/dm/NewDM';
import DM from './components/chat/dm/DM';
import useLoadUser from './hooks/useLoadUser';
import LoginNew from './components/auth/LoginNew';
import RegisterNew from './components/auth/RegisterNew';


const MainApp = ({ matches, drawerToggle }) => {
  const res = useLoadUser(localStorage.getItem('pokehub-refresh-token'));
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