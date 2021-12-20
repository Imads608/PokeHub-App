import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store/store';

const currentOpenedWindow = (state: RootState) => state['app-state'].opened
const appLoading = (state: RootState) => state['app-state'].loading;
const appError = (state: RootState) => state['app-state'].error;

export const getCurrentOpenedWindow = createSelector(
    [currentOpenedWindow], currentWindow => currentWindow
);

export const getAppLoading = createSelector(
    [appLoading], loading => loading
);

export const getAppError = createSelector(
    [appError], appError => appError
);
