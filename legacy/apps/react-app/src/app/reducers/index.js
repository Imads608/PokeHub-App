import { combineReducers } from 'redux';
import auth from './auth';
import app from './app';
import chat from './chat';
import drawer from './drawer';
import user from './user';
import notification from './notification';

export default combineReducers({
  auth,
  app,
  chat,
  drawer,
  user,
  notification,
});
