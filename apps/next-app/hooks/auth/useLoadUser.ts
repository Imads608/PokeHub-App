import { useQuery } from 'react-query';
import { useDispatch } from 'react-redux';
import { Dispatch } from 'redux';
import { getNewAccessToken, loadUser } from '../../api/auth';
import {
  IUserPublicProfile,
  IUserPublicProfileWithToken,
  UserPublicProfileWithToken,
} from '@pokehub/user';
import { login_success } from '../../store/actions/common';
import { auth_loaded } from '../../store/reducers/auth';

const useLoadUser = (refreshToken: string) => {
  const dispatch: Dispatch = useDispatch();

  const response = useQuery(['users', 'load', { refreshToken }],
    async () => {
      const rememberMe = localStorage['pokehub-rememberme'] == 'undefined' || localStorage['pokehub-rememberme'] === 'null' ? null : localStorage['pokehub-rememberme'];

      console.log('Remember Me is: ', rememberMe);
      
      if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
        throw new Error('No Refresh Token provided');
      } else if (!rememberMe) {
        throw new Error('Remember Me is not set to true');
      }

      //dispatch(requestStarted());
      const accessToken: string = await getNewAccessToken(refreshToken);
      localStorage.setItem('pokehub-access-token', accessToken);
      const user: IUserPublicProfile = await loadUser(accessToken);
      return user;
    },
    {
      onSuccess: (data: IUserPublicProfile) => {
        if (data) {
          console.log('Successful Load User:', data);
          const dataWithTokens: IUserPublicProfileWithToken = {
            user: data.user,
            accessToken: localStorage.getItem('pokehub-access-token'),
            refreshToken: localStorage.getItem('pokehub-refresh-token'),
            joinedPublicRooms: data.joinedPublicRooms,
          };

          dispatch(login_success(dataWithTokens));
        }
      },
      onError: () => {
        console.log('loaded');
        //dispatch(appLoaded());
        dispatch(auth_loaded());
      },
      enabled: true, //refreshToken && refreshToken !== 'undefined' ? true : false,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: Infinity,
    }
  );

  return response;
};

export default useLoadUser;
