import { createSelector, OutputSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { APIError } from '../../types/api';

const authLoading = (state: RootState) => state['auth-state'].loading;
const emailVerified = (state: RootState) => state['auth-state'].isEmailVerified;
const authenticated = (state: RootState) => state['auth-state'].isAuthenticated;
const authError = (state: RootState) => state['auth-state'].error;
const accessToken = (state: RootState) => state['auth-state'].accessToken;

export const getAuthLoading = createSelector(
  [authLoading],
  (authLoading) => authLoading
);

export const getIsAuthenticated = createSelector(
  [authenticated],
  (authenticated) => authenticated
);

export const getIsEmailVerified = createSelector(
  [emailVerified],
  (emailVerified) => emailVerified
);

/*export const getAuthUserAndLoading = createSelector(
    [getUserAuth, getAuthLoading], (user, loading) => ({ user, loading})
);

export const getUidAndLoading = createSelector(
    [getUserUid, getAuthLoading], (uid, loading) => ({ uid, loading })
);*/

export const getAuthError = createSelector(
  [authError],
  (authError) => authError
);

export const getAccessToken = createSelector(
  [accessToken], (accessToken) => accessToken
)
