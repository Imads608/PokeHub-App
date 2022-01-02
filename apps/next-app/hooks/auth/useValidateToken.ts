import { useQuery, UseQueryResult } from 'react-query';
import { validateToken } from '../../api/auth';
import { AxiosError } from 'axios';
import { APIError } from '../../types/api';
import { TokenTypes } from '@pokehub/auth';

const useValidateToken = ( token: string, tokenType: TokenTypes, enable: boolean ) => {
  const res: UseQueryResult<boolean, Error | AxiosError<APIError>> = useQuery(['tokens', 'validation', tokenType, { token }], async () => await validateToken(token, tokenType), {
    onSuccess: (data: boolean) => {
      console.log('useValidateToken Result:', data, token);
    },
    onError: (err: Error | AxiosError<APIError>) => {
      console.error('useValidateToken Got error: ', err);
    },

    enabled: enable ? true : false,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  });

  return res;
};

export default useValidateToken;
