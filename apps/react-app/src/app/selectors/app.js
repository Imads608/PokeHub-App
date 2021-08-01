import { createSelector } from '@reduxjs/toolkit';

const currentOpenedWindow = state => state.app.opened
const appLoading = state => state.app.loading;
const appError = state => state.app.error;

export const getCurrentOpenedWindow = createSelector(
    [currentOpenedWindow], currentWindow => currentWindow
);

export const getAppLoading = createSelector(
    [appLoading], loading => loading
);

export const getAppError = createSelector(
    [appError], appError => appError
);
