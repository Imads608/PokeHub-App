import { useQuery, UseQueryResult } from 'react-query';
import { activateUser } from '../../api/auth';
import { AxiosError } from 'axios';
import { IUserProfileWithToken } from '@pokehub/user/interfaces';
import { APIError } from '../../types/api';

export const useEmailActivation = (validationToken: string) => {
  const res: UseQueryResult<IUserProfileWithToken, Error | AxiosError<APIError>> = useQuery(['users', 'activate', { activationToken: validationToken }], 
    async () => await activateUser(validationToken),
    {
      onSuccess: (userData: IUserProfileWithToken) => {
        console.log('useEmailActivation: Success on Account Activation:', userData);
      },
      onError: (err: Error | AxiosError<APIError>) => {
        console.log('useEmailActivation: Got error: ', err);
      },
      enabled: true,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      staleTime: 30000,
    }
  );

  return res;
};