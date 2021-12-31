import { useMutation } from 'react-query';
import { sendPasswordResetEmail } from '../../api/mail';
import { AxiosError } from 'axios';
import { APIError } from '../../types/api';

export const useSendPasswordReset = () => {
  const mutation = useMutation(
    'send-password-reset',
    (email: string) => sendPasswordResetEmail(email),
    {
      onSuccess: (data) => {
        console.log('useSendPasswordReset: Got success response');
      },
      onError: (err: Error | AxiosError<APIError>) => {
        console.error(`useSendPasswordReset: Got error: ${JSON.stringify(err)}`);
      },
    }
  );

  return mutation;
};
