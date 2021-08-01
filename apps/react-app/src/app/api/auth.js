import axios from 'axios';
import { getAPIRequestHeader } from '../utils';
import appConfig from '../config';

export const getCurrentUserData = async (uid) => {
    const userServiceRes = await axios.get(`${appConfig.apiGateway}/users/${uid}`, getAPIRequestHeader());
    return userServiceRes.data;
}

export const createUser = async (username, email, password) => {
    const body = JSON.stringify({ username, email, password });
    const userServiceRes = await axios.post(`${appConfig.apiGateway}/users`, body, getAPIRequestHeader());
    return userServiceRes.data;
}

export const createOAuthUser = async (username, email, firstName, lastName, accountType) => {
    const body = JSON.stringify({ username, firstName, lastName, email, accountType});
    const userServiceRes = await axios.post(`${appConfig.apiGateway}/users/oauth`, body, getAPIRequestHeader());
    return userServiceRes.data;
}