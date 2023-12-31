import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const authLoading = (state: RootState) => state['auth-state'].loading;
const emailVerified = (state: RootState) => state['auth-state'].isEmailVerified;
const authenticated = (state: RootState) => state['auth-state'].isAuthenticated;
const authError = (state: RootState) => state['auth-state'].error;
const initialAccessToken = (state: RootState) => state['auth-state'].accessTokenOnLogin;

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

export const getAuthError = createSelector(
  [authError],
  (authError) => authError
);

export const getInitialAccessToken = createSelector(
  [initialAccessToken], (initialAccessToken) => initialAccessToken
)
