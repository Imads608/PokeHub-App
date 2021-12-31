import { useMutation } from 'react-query';
import { resetPassword } from '../../api/auth';
import { AxiosError } from 'axios';
import { APIError } from '../../types/api';

export const usePasswordReset = () => {
  const mutation = useMutation(
    'password-reset',
    (data: { resetToken: string, newPassword: string }) => resetPassword(data.resetToken, data.newPassword),
    {
      onSuccess: (data) => {
        console.log('usePasswordReset: Got success response');
      },
      onError: (err: Error | AxiosError<APIError>) => {
        console.error(`usePasswordReset: Got error: ${JSON.stringify(err)}`);
      },
    }
  );

  return mutation;
};
