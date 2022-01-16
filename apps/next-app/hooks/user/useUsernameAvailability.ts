import { useQuery, UseQueryResult } from 'react-query';
import { isUsernameAvailable } from '../../api/user';
import { AxiosError } from 'axios';
import { APIError } from '../../types/api';
import { UserIdTypes } from '@pokehub/user/interfaces';

export const useUsernameAvailability = (username: string, enable: boolean) => {
  const res: UseQueryResult<boolean, Error | AxiosError<APIError>> = useQuery(['users', 'availability', { id: username, type: UserIdTypes.USERNAME }], 
    async () => await isUsernameAvailable(username), {
    onSuccess: (data: boolean) => {
      console.log('useUsernameAvailability Result: ', data);
    },
    onError: (err: Error | AxiosError<APIError>) => {
      console.error('useUsernameAvailability Got error: ', err);
    },

    enabled: enable ? true : false,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  });

  return res;
};
