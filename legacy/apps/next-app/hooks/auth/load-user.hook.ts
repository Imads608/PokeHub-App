import { useQuery } from 'react-query';
import { useDispatch } from 'react-redux';
import { Dispatch } from 'redux';
import { getNewAccessToken, loadUserProxy } from '../../api/auth';
import {
  IUserProfile,
  IUserProfileWithToken,
} from '@pokehub/user/interfaces';
import { login_success } from '../../store/common/common.actions';
import { auth_loaded } from '../../store/auth/auth.reducer';
import http from 'apps/next-app/axios';

const useLoadUser = (enable: boolean, refreshToken?: string) => {
  const dispatch: Dispatch = useDispatch();

  const response = useQuery(['users', 'load', { refreshToken }],
    async () => await loadUserProxy(),
    {
      onSuccess: (data: IUserProfile) => {
        if (data) {
          console.log('Successful Load User:', data);
          const dataWithTokens: IUserProfileWithToken = {
            user: data.user,
            accessToken: localStorage.getItem('pokehub-access-token'),
            //refreshToken: localStorage.getItem('pokehub-refresh-token'),
            joinedPublicRooms: data.joinedPublicRooms,
          };

          dataWithTokens.accessToken && (http.defaults.headers.Authorization = dataWithTokens.accessToken);
          dispatch(login_success(dataWithTokens));
        }
      },
      onError: (err) => {
        console.log('loaded: ', err);
        dispatch(auth_loaded(false));
      },
      enabled: enable, //refreshToken && refreshToken !== 'undefined' ? true : false,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: Infinity,
    }
  );

  return response;
};

export default useLoadUser;
