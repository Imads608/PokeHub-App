import { LOGIN_SUCCESS, LOGOUT } from '../actions/types/auth';
import { useInterceptors } from '../axios';

export const authMiddleware = (store) => (next) => (action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      localStorage.setItem('pokehub-access-token', action.payload.accessToken);
      localStorage.setItem(
        'pokehub-refresh-token',
        action.payload.refreshToken
      );
      console.log('Setting up interceptors');
      useInterceptors();
      break;
    case LOGOUT:
      localStorage.removeItem('pokehub-access-token');
      localStorage.removeItem('pokehub-refresh-token');
      break;
  }

  next(action);
};
