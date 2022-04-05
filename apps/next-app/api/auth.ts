import axios, { AxiosResponse } from 'axios';
import { getAPIRequestHeader } from './utils';
import appConfig from '../config';
import http from '../axios';
import { IUserData, IUserProfile, IUserProfileWithToken, IUserPublicProfile, } from '@pokehub/user/interfaces';
import { TokenTypes } from '@pokehub/auth/interfaces';

export const getCurrentUserData = async (uid) => {
  const userServiceRes = await axios.get(
    `${appConfig.apiGateway}/users/${uid}`,
    getAPIRequestHeader()
  );
  return userServiceRes.data;
};

export const loginUserProxy = async (userId: string, password: string) => {
  console.log('Going to login user');
  const resp: AxiosResponse<IUserProfileWithToken> = await axios.post(`/api/auth/login`,
    { email: userId, password }
  );
  http.defaults.headers.Authorization = resp.data.accessToken;
  return resp.data;
};

export const signupUser = async ( email: string, username: string, password: string ) => {
  const resp: AxiosResponse<IUserProfileWithToken> = await http.post(`/users`, { email, username, password }, getAPIRequestHeader());
  return resp.data;
};

export const getNewAccessToken = async () => {
  const resp: AxiosResponse<{ access_token: string }> = await http.get( `/auth/access-token` );
  return resp.data.access_token;
};

export const getNewAccessTokenResponse = async () => {
  const resp: AxiosResponse<{ access_token: string }> = await http.get( `/auth/access-token` );
  return resp;
};

export const logoutUserProxy = async () => {
  const resp: AxiosResponse<{ message: string }> = await axios.post('/api/auth/logout');
  http.defaults.headers.Authorization = null;
  return resp.data;
}

export const loadUserProxy = async () => {
  const resp: AxiosResponse<IUserProfileWithToken> = await axios.get( `/api/auth/load-user` );
  console.log('loadUserProxy: Loaded User Proxy result:', resp.data.accessToken);
  http.defaults.headers.Authorization = resp.data.accessToken;
  return resp.data as IUserProfile;
}

export const loadUser = async () => {
  const resp: AxiosResponse<IUserProfile> = await http.get('/users/auth');
  return resp.data;
};

export const googleOAuthLogin = async (googleTokenId: string) => {
  console.log('googleOAuthLogin: Logging in Google OAuth User', googleTokenId);
  const response: AxiosResponse<IUserProfileWithToken> = await axios.post( `/api/auth/oauth-google`, null,
    {
      headers: {
        Authorization: googleTokenId,
      },
    }
  );

  return response.data;
};

export const oauthLoginProxy = async (oauthToken: string) => {
  console.log('oauthLoginProxy: Logging in Google OAuth User', oauthToken);
  const resp: AxiosResponse<IUserProfileWithToken> = await axios.get( `/api/auth/oauth-load`, { headers: { Authorization: oauthToken } } );
  console.log('oatuhLoginProxy: Loaded User Proxy result');
  http.defaults.headers.Authorization = resp.data.accessToken;
  return resp.data as IUserProfile;
};

export const oauthLoad = async () => {
  const resp: AxiosResponse<IUserProfile> = await http.get('/users/oauth-load');
  return resp.data;
}

export const activateUser = async (verificationToken: string) => {
  const resp: AxiosResponse<IUserData> = await http.get(`/users/auth/activate`, { headers: { Authorization: verificationToken } });
  return resp.data;
};

export const resetPassword = async (resetToken: string, newPassword: string) => {
    const resp: AxiosResponse<IUserData> = await http.post(`/users/auth/password-reset`, { password: newPassword },
                { headers: { Authorization: resetToken } });
    return resp.data;
};

export const validateToken = async (token: string, tokenType: TokenTypes) => {
    const headers = getAPIRequestHeader();
    const resp: AxiosResponse<boolean> = await http.get( `/auth/token-validation`, 
                { ...headers, params: { token: token, tokenType: tokenType }});
    return resp.data;
}