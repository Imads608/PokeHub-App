import { IUserProfile, IUserProfileWithToken } from '@pokehub/user/interfaces';
import {  useQuery } from 'react-query';
import { useDispatch } from 'react-redux';
import { login_success } from '../../store/actions/common';
import { oauthLoginProxy } from '../../api/auth';
import { Dispatch } from '@reduxjs/toolkit';
import { auth_loaded } from '../../store/reducers/auth';

const useOAuthLoad = (oauthToken: string, enable: boolean) => {
  const dispatch: Dispatch = useDispatch();

  const response = useQuery(['users', 'oauth-login', { oauthToken }],
    async () => await oauthLoginProxy(oauthToken),
    {
      onSuccess: (data: IUserProfile) => {
        if (data) {
          console.log('Successful Load User:', data);
          const dataWithTokens: IUserProfileWithToken = {
            user: data.user,
            accessToken: localStorage.getItem('pokehub-access-token'),
            joinedPublicRooms: data.joinedPublicRooms,
          };

          dispatch(login_success(dataWithTokens));
        }
      },
      onError: (err) => {
        console.log('loaded: ', err);
        dispatch(auth_loaded(false));
      },
      enabled: enable,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: Infinity,
    }
  );

  return response;
};

export default useOAuthLoad;