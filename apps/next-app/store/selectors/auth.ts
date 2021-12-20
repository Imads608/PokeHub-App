import { createSelector, OutputSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { APIError } from '../../types/api';

const authLoading = (state: RootState) => state['auth-state'].loading;
//const authToken = (state: RootState) => state['auth-state'].token;
const authenticated = (state: RootState) => state['auth-state'].isAuthenticated;
const authError = (state: RootState) => state['auth-state'].error;

export const getAuthLoading = createSelector(
    [authLoading], loading => loading
);

export const getIsAuthenticated = createSelector(
    [authenticated], isAuthenticated => isAuthenticated
)

/*export const getAuthUserAndLoading = createSelector(
    [getUserAuth, getAuthLoading], (user, loading) => ({ user, loading})
);

export const getUidAndLoading = createSelector(
    [getUserUid, getAuthLoading], (uid, loading) => ({ uid, loading })
);*/

export const getAuthError = createSelector(
    [authError], error => error
);