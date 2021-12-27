import { useQuery, UseQueryResult } from 'react-query';
import { activateUser } from '../../api/auth';
import { AxiosError } from 'axios';
import { IUserPublicProfileWithToken } from '@pokehub/user';
import { APIError } from '../../types/api';

const useEmailActivation = (validationToken: string) => {
  const res: UseQueryResult<
    IUserPublicProfileWithToken,
    Error | AxiosError<APIError>
  > = useQuery(
    'activate-user',
    async () => await activateUser(validationToken),
    {
      onSuccess: (userData: IUserPublicProfileWithToken) => {
        console.log('Success on Account Activation:', userData);
      },
      onError: (err: Error | AxiosError<APIError>) => {
        console.log('Got error: ', err);
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

export default useEmailActivation;
