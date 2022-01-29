import axios, { AxiosResponse } from 'axios';
import { getAPIRequestHeader } from './utils';
import appConfig from '../config';
import http from '../axios';
import { IUserData, IUserPublicProfile, IUserPublicProfileWithToken, } from '@pokehub/user/interfaces';
import { TokenTypes } from '@pokehub/auth/interfaces';

export const getCurrentUserData = async (uid) => {
  const userServiceRes = await axios.get(
    `${appConfig.apiGateway}/users/${uid}`,
    getAPIRequestHeader()
  );
  return userServiceRes.data;
};

export const loginUser = async (userId: string, password: string) => {
  console.log('Going to login user');
  const resp: AxiosResponse<IUserPublicProfileWithToken> = await axios.post(
    `/api/auth/login`,
    { email: userId, password }
  );
  return resp.data;
};

export const signupUser = async ( email: string, username: string, password: string ) => {
  const resp: AxiosResponse<IUserPublicProfileWithToken> = await http.post( `${appConfig.apiGateway}/users`, { email, username, password },
              getAPIRequestHeader()
  );
  return resp.data;
};

export const getNewAccessToken = async () => {
  const resp: AxiosResponse<{ access_token: string }> = await http.get( `${appConfig.apiGateway}/auth/access-token` );
  return resp.data.access_token;
};

export const logoutUser = async () => {
  const resp: AxiosResponse<{ message: string }> = await axios.post('/api/auth/logout');
  return resp.data;
}

export const loadUserProxy = async () => {
  const resp: AxiosResponse<IUserPublicProfile> = await axios.get( `/api/auth/load-user` );
  return resp.data
}

export const loadUser = async () => {
  const resp: AxiosResponse<IUserPublicProfile> = await http.get( `${appConfig.apiGateway}/users/auth`, );
  return resp.data;
};

export const googleOAuthLogin = async (googleTokenId: string) => {
  console.log('googleOAuthLogin: Logging in Google OAuth User', googleTokenId);
  const response: AxiosResponse<IUserPublicProfileWithToken> = await axios.post( `/api/auth/oauth-google`, null,
    {
      headers: {
        Authorization: googleTokenId,
      },
    }
  );

  return response.data;
};

export const activateUser = async (verificationToken: string) => {
  const resp: AxiosResponse<IUserData> = await http.get( `${appConfig.apiGateway}/users/auth/activate`,
    { headers: { Authorization: verificationToken } }
  );
  return resp.data;
};

export const resetPassword = async (resetToken: string, newPassword: string) => {
    const resp: AxiosResponse<IUserData> = await http.post( `${appConfig.apiGateway}/users/auth/password-reset`, { password: newPassword },
      { headers: { Authorization: resetToken } }
    );
    return resp.data;
};

export const validateToken = async (token: string, tokenType: TokenTypes) => {
    const headers = getAPIRequestHeader();
    const resp: AxiosResponse<boolean> = await http.get( `${appConfig.apiGateway}/auth/token-validation`, 
                { ...headers, params: { token: token, tokenType: tokenType }});
    return resp.data;
}