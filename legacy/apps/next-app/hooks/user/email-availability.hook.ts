import { useQuery, UseQueryResult } from 'react-query';
import { isEmailAvailable } from '../../api/user';
import { AxiosError } from 'axios';
import { APIError } from '../../types/api';
import { UserIdTypes } from '@pokehub/user/interfaces';

export const useEmailAvailability = (email: string, enable: boolean) => {
  const res: UseQueryResult<boolean, Error | AxiosError<APIError>> = useQuery(['users', 'availability', { id: email, type: UserIdTypes.EMAIL }], 
    async () => await isEmailAvailable(email), {
    onSuccess: (data: boolean) => {
      console.log('useEmailAvailability Result: ', data);
    },
    onError: (err: Error | AxiosError<APIError>) => {
      console.error('useEmailAvailability Got error: ', err);
    },

    enabled: enable,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  });

  return res;
};
