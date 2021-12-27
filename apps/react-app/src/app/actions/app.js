import {
  REQUEST_START,
  REQUEST_FAILURE,
  REQUEST_SUCCESS,
  SET_OPEN_WINDOW,
  APP_LOADED,
  RESET_APP_ERROR,
} from './types/app';
import { USER_NOTIFICATION } from '../types/socket';

export const requestStarted = () => {
  return {
    type: REQUEST_START,
    payload: null,
  };
};

export const requestFailure = (e) => {
  return {
    type: REQUEST_FAILURE,
    payload: e,
  };
};

export const requestSuccess = () => {
  return {
    type: REQUEST_SUCCESS,
    payload: null,
  };
};

export const setOpenWindow = (e) => {
  return {
    type: SET_OPEN_WINDOW,
    payload: e,
  };
};

export const appLoaded = () => {
  return {
    type: APP_LOADED,
    payload: null,
  };
};

export const resetAppError = () => {
  return {
    type: RESET_APP_ERROR,
    payload: null,
  };
};
