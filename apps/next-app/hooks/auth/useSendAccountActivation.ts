import { useMutation } from 'react-query';
import { sendAccountActivationEmail } from '../../api/mail';
import { IJwtTokenBody } from '@pokehub/auth/interfaces';
import { AxiosError } from 'axios';

export const useSendAccountActivation = () => {
  const mutation = useMutation((userData: IJwtTokenBody) => sendAccountActivationEmail(userData),
    {
      onSuccess: (data) => {
        console.log('useSignupUser: Got success response');
      },
      onError: (err: Error | AxiosError) => {
        console.error(`useSignupUser: Got error: ${JSON.stringify(err)}`);
      },
    }
  );

  return mutation;
};
