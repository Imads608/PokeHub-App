import { IUserPublicProfileWithToken } from '@pokehub/user';
import axios, { AxiosError } from 'axios';
import { useMutation, UseMutationResult } from 'react-query';
import { useDispatch } from 'react-redux';
import { auth_failure, login_success } from '../../store/actions/common';
import { googleOAuthLogin } from '../../api/auth';
import { APIError } from '../../types/api';

export const useGoogleOAuthLogin = () => {
  const dispatch = useDispatch();
  const mutation: UseMutationResult<
    IUserPublicProfileWithToken,
    Error | AxiosError<APIError>
  > = useMutation(
    'google-oauth',
    (tokenId: string) => googleOAuthLogin(tokenId),
    {
      onSuccess: (data: IUserPublicProfileWithToken) => {
        console.log('Got successful response from api:', data);
        data && dispatch(login_success(data));
      },
      onError: (err: Error | AxiosError<APIError>) => {
        if (err && axios.isAxiosError(err)) {
          const apiError = err as AxiosError<APIError>;
          dispatch(auth_failure(apiError.response?.data));
        } else {
          dispatch(auth_failure({ statusCode: 500, message: err.message }));
        }
      },
    }
  );

  return mutation;
};
