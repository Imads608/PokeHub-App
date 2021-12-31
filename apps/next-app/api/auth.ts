import axios, { AxiosResponse } from 'axios';
import { getAPIRequestHeader } from './utils';
import appConfig from '../config';
import { useInterceptors } from '../axios';
import {
  IUserData,
  IUserPublicProfile,
  IUserPublicProfileWithToken,
} from '@pokehub/user';
import { TokenTypes } from '@pokehub/auth';

export const getCurrentUserData = async (uid) => {
  const userServiceRes = await axios.get(
    `${appConfig.apiGateway}/users/${uid}`,
    getAPIRequestHeader()
  );
  return userServiceRes.data;
};

export const createUser = async (
  username: string,
  email: string,
  password: string
) => {
  const body = JSON.stringify({ username, email, password });
  const userServiceRes = await axios.post(
    `${appConfig.apiGateway}/users`,
    body,
    getAPIRequestHeader()
  );
  return userServiceRes.data;
};

export const loginUser = async (userId: string, password: string) => {
  console.log('Going to login user');
  const resp: AxiosResponse<IUserPublicProfileWithToken> = await axios.post(
    `${appConfig.apiGateway}/auth/login`,
    { email: userId, password }
  );
  return resp.data;
};

export const signupUser = async (
  email: string,
  username: string,
  password: string
) => {
  console.log('Password is ', password, username);
  const resp: AxiosResponse<IUserPublicProfileWithToken> = await axios.post(
    `${appConfig.apiGateway}/users`,
    { email, username, password },
    getAPIRequestHeader()
  );
  return resp.data;
};

export const getNewAccessToken = async (refreshToken: string) => {
  const resp: AxiosResponse<{ access_token: string }> = await axios.get(
    `${appConfig.apiGateway}/auth/access-token`,
    { headers: { Authorization: refreshToken } }
  );
  return resp.data.access_token;
};

export const loadUser = async (accessToken: string) => {
  const resp: AxiosResponse<IUserPublicProfile> = await axios.get(
    `${appConfig.apiGateway}/users/auth`,
    { headers: { Authorization: accessToken } }
  );
  return resp.data;
};

export const googleOAuthLogin = async (googleTokenId: string) => {
  console.log('Logging in Google OAuth User', googleTokenId);
  const response: AxiosResponse<IUserPublicProfileWithToken> = await axios.post(
    `${appConfig.apiGateway}/auth/oauth-google`,
    null,
    {
      headers: {
        Authorization: googleTokenId,
      },
    }
  );

  return response.data;
};

export const activateUser = async (verificationToken: string) => {
  const resp: AxiosResponse<IUserData> = await axios.get(
    `${appConfig.apiGateway}/users/auth/activate`,
    { headers: { Authorization: verificationToken } }
  );
  return resp.data;
};

export const resetPassword = async (resetToken: string, newPassword: string) => {
    const resp: AxiosResponse<IUserData> = await axios.post(
      `${appConfig.apiGateway}/users/auth/password-reset`, { password: newPassword },
      { headers: { Authorization: resetToken } }
    );
    return resp.data;
};

export const validateToken = async (token: string, tokenType: TokenTypes) => {
    const headers = getAPIRequestHeader();
    const resp: AxiosResponse<boolean> = await axios.get(
        `${appConfig.apiGateway}/auth/token-validation`, { ...headers, params: { token: token, tokenType: tokenType }});
    return resp.data;
}