import { useQuery, UseQueryResult } from 'react-query';
import { getUserPublicProfile } from '../../api/user';
import { AxiosError } from 'axios';
import { APIError } from '../../types/api';
import { IUserPublicProfile } from '@pokehub/user/interfaces';

export const useUserPublicProfile = (uid: string) => {
  const res: UseQueryResult<IUserPublicProfile, Error | AxiosError<APIError>> = useQuery(['users', 'profile', uid], 
    async () => await getUserPublicProfile(uid), {
    onSuccess: (data: IUserPublicProfile) => {
      console.log('useUserPublicProfile Result: ', data);
    },
    onError: (err: Error | AxiosError<APIError>) => {
      console.error('useUserPublicProfile Got error: ', err);
    },

    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  });

  return res;
};
