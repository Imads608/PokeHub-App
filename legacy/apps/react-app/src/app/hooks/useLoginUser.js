import { useQuery } from 'react-query';
import { useDispatch } from 'react-redux';
import { authFailure, loggedIn, setAuthLoaded } from '../actions/auth';
import { loginUser } from '../api/auth';

const useLoginUser = (userId, password, enable) => {
  const dispatch = useDispatch();
  const res = useQuery(
    'user-login',
    async () => await loginUser(userId, password),
    {
      onSuccess: (userData) => {
        console.log('Success on Login:', userData);
        userData && dispatch(loggedIn(userData));
      },
      onError: (err) => {
        if (err && err.response && err.response.data) {
          dispatch(authFailure(err.response.data));
        }
      },

      enabled: enable ? true : false,
      retry: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      staleTime: 30000,
    }
  );

  return res;
};

export default useLoginUser;
