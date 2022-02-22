import { useQuery } from 'react-query';
import { useDispatch } from 'react-redux';
import { Dispatch } from 'redux';
import { getNewAccessToken, loadUserProxy } from '../../api/auth';
import {
  IUserProfile,
  IUserProfileWithToken,
} from '@pokehub/user/interfaces';
import { login_success } from '../../store/actions/common';
import { auth_loaded } from '../../store/reducers/auth';

const useLoadUser = (refreshToken: string, enable: boolean) => {
  const dispatch: Dispatch = useDispatch();

  const response = useQuery(['users', 'load', { refreshToken }],
    async () => await loadUserProxy()/*{
      //const rememberMe = localStorage['pokehub-rememberme'] == 'undefined' || localStorage['pokehub-rememberme'] === 'null' ? null : localStorage['pokehub-rememberme'];

      //console.log('Remember Me is: ', rememberMe);
      
      /*if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
        throw new Error('No Refresh Token provided');
      } else if (!rememberMe) {
        throw new Error('Remember Me is not set to true');
      }*/
      /*
      //dispatch(requestStarted());
      //const accessToken: string = await getNewAccessToken(refreshToken);
      //localStorage.setItem('pokehub-access-token', accessToken);
      const user: IUserProfile = await loadUserProxy();
      return user;
    }*/,
    {
      onSuccess: (data: IUserProfile) => {
        if (data) {
          console.log('Successful Load User:', data);
          const dataWithTokens: IUserProfileWithToken = {
            user: data.user,
            status: data.status,
            accessToken: localStorage.getItem('pokehub-access-token'),
            //refreshToken: localStorage.getItem('pokehub-refresh-token'),
            joinedPublicRooms: data.joinedPublicRooms,
          };

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
