import { IJwtTokenBody } from '@pokehub/auth/interfaces';
import axios, { AxiosResponse } from 'axios';
import appConfig from '../config';
import { getAPIRequestHeader } from './utils';

export const sendAccountActivationEmail = async (userData: IJwtTokenBody) => {
  const resp: AxiosResponse<void> = await axios.post(
    `${appConfig.apiGateway}/mail/account-activation`,
    userData,
    getAPIRequestHeader()
  );
  return resp.data;
};

export const sendPasswordResetEmail = async (email: string) => {
    const resp: AxiosResponse<void> = await axios.post(`${appConfig.apiGateway}/mail/password-reset`, { email }, getAPIRequestHeader());
    return resp.data;
  };

