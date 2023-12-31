import axios from 'axios';
import { getAPIRequestHeader } from '../utils';
import appConfig from '../config';
import { useInterceptors } from '../axios';

export const getCurrentUserData = async (uid) => {
  const userServiceRes = await axios.get(
    `${appConfig.apiGateway}/users/${uid}`,
    getAPIRequestHeader()
  );
  return userServiceRes.data;
};

export const createUser = async (username, email, password) => {
  const body = JSON.stringify({ username, email, password });
  const userServiceRes = await axios.post(
    `${appConfig.apiGateway}/users`,
    body,
    getAPIRequestHeader()
  );
  return userServiceRes.data;
};

/*
export const createOAuthUser = async (username, email, firstName, lastName, accountType) => {
    const body = JSON.stringify({ username, firstName, lastName, email, accountType});
    const userServiceRes = await axios.post(`${appConfig.apiGateway}/users/oauth`, body, getAPIRequestHeader());
    return userServiceRes.data;
}*/

export const loginUser = async (userId, password) => {
  console.log('Going to login user');
  try {
    const resp = await axios.post(`${appConfig.apiGateway}/auth/login`, {
      email: userId,
      password,
    });
    return resp.data;
  } catch (err) {
    //if (err.message)
    //    throw new Error(err.message);
    throw err;
  }
};

export const signupUser = async (email, username, password) => {
  console.log('Password is ', password, username);
  const resp = await axios.post(
    `${appConfig.apiGateway}/users`,
    { email, username, password },
    getAPIRequestHeader()
  );
  return resp.data;
};

export const getNewAccessToken = async (refreshToken) => {
  const resp = await axios.get(`${appConfig.apiGateway}/auth/access-token`, {
    headers: { Authorization: refreshToken },
  });
  return resp.data.access_token;
};

export const loadUser = async (accessToken) => {
  const resp = await axios.get(`${appConfig.apiGateway}/users/auth`, {
    headers: { Authorization: accessToken },
  });
  return resp.data;
};

export const googleOAuthLogin = async (googleTokenId) => {
  console.log('Logging in Google OAuth User', googleTokenId);
  const response = await axios.post(
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
