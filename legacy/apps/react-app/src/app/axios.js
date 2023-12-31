import axios from 'axios';
import appConfig from './config';

export const useInterceptors = () => {
  //request interceptor to add the auth token header to requests
  axios.interceptors.request.use(
    (config) => {
      const accessToken = localStorage.getItem('pokehub-access-token');
      if (accessToken) {
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
    (response) => {
      return response;
    },
    (error) => {
      const originalRequest = error.config;
      let refreshToken = localStorage.getItem('pokehub-refresh-token');
      if (
        refreshToken &&
        error.response.status === 401 &&
        !originalRequest._retry
      ) {
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
                res.data.accessToken
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
