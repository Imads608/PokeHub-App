import { login_success, logout } from '../actions/common';
import { useInterceptors } from '../../axios';
import { auth_loaded } from '../reducers/auth';

export const authMiddleware = (store) => (next) => (action) => {
  console.log('In Auth Middleware');
  switch (action.type) {
    case login_success.toString():
      localStorage.setItem('pokehub-access-token', action.payload.accessToken);
      localStorage.setItem(
        'pokehub-refresh-token',
        action.payload.refreshToken
      );
      console.log('authMiddleware: Setting up interceptors');
      useInterceptors();
      break;
    case logout.toString():
      console.log('In Logout');
      localStorage.removeItem('pokehub-access-token');
      localStorage.removeItem('pokehub-refresh-token');
      break;
    case auth_loaded.toString():
      if (action && action.payload == false) {
        localStorage.removeItem('pokehub-access-token');
        localStorage.removeItem('pokehub-refresh-token');
      }
      break;
  }

  next(action);
};
