import { useMutation } from "react-query";
import { sendAccountActivationEmail } from '../../api/mail';
import { IJwtTokenBody } from "@pokehub/auth";
import { AxiosError } from "axios";

export const useSendAccountActivation = () => {
    const mutation = useMutation('send-account-activation', (userData: IJwtTokenBody) => sendAccountActivationEmail(userData), {
        onSuccess: (data) => {
            console.log('useSignupUser: Got success response');
        },
        onError: (err: Error | AxiosError) => {
            console.error(`useSignupUser: Got error: ${JSON.stringify(err)}`);
        },
    });

    return mutation;
}