import { createSelector } from '@reduxjs/toolkit';

const authLoading = state => state.auth.loading;
const authToken = state => state.auth.token;
const authenticated = state => state.auth.isAuthenticated;
const authError = state => state.auth.error;

export const getAuthLoading = createSelector(
    [authLoading], loading => loading
);

export const getToken = createSelector(
    [authToken], token => token
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