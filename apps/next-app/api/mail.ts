import { IJwtTokenBody } from '@pokehub/auth';
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
