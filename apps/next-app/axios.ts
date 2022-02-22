import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import appConfig from './config';

import createAuthRefreshInterceptor from 'axios-auth-refresh';

const http = axios.create({
  baseURL: `${appConfig.apiGateway}`,
  withCredentials: false,
});

createAuthRefreshInterceptor(http, (failedRequest => http.get(`${appConfig.frontend}/api/auth/load-user`).then(resp => {
  const { accessToken } = resp.data;
  console.log('Refetching Access Token');
  //const bearer = `Bearer ${accessToken}`;
  http.defaults.headers.Authorization = accessToken;
  failedRequest.response.config.headers.Authorization = accessToken;//bearer;
  return Promise.resolve();
})), { statusCodes: [401, 403] });

export default http;


export const useInterceptors = () => {
  //request interceptor to add the auth token header to requests
  axios.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      const accessToken: string = localStorage.getItem('pokehub-access-token');
      if (accessToken && accessToken != 'null' && accessToken != 'undefined') {
        console.log('Axios Request Interceptor: Setting up Access Token');
        config.headers['Authorization'] = accessToken;
      }
      return config;
    },
    (error) => {
      Promise.reject(error);
    }
  );

  //response interceptor to refresh token on receiving token expired error
  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log('Axios Response Interceptor: Got response');
      return response;
    },
    (error) => {
      const originalRequest = error.config;
      const refreshToken: string = localStorage.getItem( 'pokehub-refresh-token' );
      if ( refreshToken && refreshToken != 'undefined' && refreshToken != 'null' && 
         (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry ) {
        console.log('Axios Response Interceptor: Got 401 error, getting new access token');
        localStorage.removeItem('pokehub-access-token');
        originalRequest._retry = true;
        return axios
          .get(`${appConfig.apiGateway}/auth/access-token`, {
            headers: {
              Authorization: refreshToken,
              'Content-Type': 'application/json',
            },
          })
          .then((res) => {
            if (res.status === 200) {
              localStorage.setItem(
                'pokehub-access-token',
                res.data.access_token
              );
              console.log('Access token refreshed!');
              return axios(originalRequest);
            }
          });
      }
      return Promise.reject(error);
    }
  );
};
