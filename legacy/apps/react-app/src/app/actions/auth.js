import {
  LOGIN_SUCCESS,
  AUTH_FAILURE,
  RESET_AUTH_FAILURE,
  LOGOUT,
  AUTH_LOADED,
} from './types/auth';

export const loggedIn = (auth) => {
  return {
    type: LOGIN_SUCCESS,
    payload: auth,
  };
};

export const setAuthLoaded = () => {
  return {
    type: AUTH_LOADED,
    payload: null,
  };
};

export const authFailure = (error) => {
  return {
    type: AUTH_FAILURE,
    payload: error,
  };
};

export const resetAuthError = () => {
  return {
    type: RESET_AUTH_FAILURE,
    payload: null,
  };
};

export const loggedOut = () => {
  return {
    type: LOGOUT,
    payload: null,
  };
};
