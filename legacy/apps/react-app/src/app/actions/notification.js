import { ERROR } from '../types/notification';
import { ERROR_NOTIFICATION, RESET_NOTIFICATION } from './types/notification';

export const setErrorNotification = (
  message,
  component = 'AlertNotification',
  desiredState,
  otherProps = null
) => {
  return {
    type: ERROR_NOTIFICATION,
    payload: {
      type: ERROR,
      message,
      component: component,
      desiredState,
      otherProps,
    },
  };
};

export const resetNotification = () => {
  return {
    type: RESET_NOTIFICATION,
    payload: null,
  };
};
