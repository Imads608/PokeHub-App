import { IUserPublicProfileWithToken } from "@pokehub/user";
import { UserSignup } from "../../types/auth";
import axios, { AxiosError } from "axios";
import { useMutation } from "react-query";
import { useDispatch } from "react-redux";
import { auth_failure, login_success, login_success_verification_needed } from "../../store/actions/common";
import { signupUser } from '../../api/auth';
import { APIError } from '../../types/api';

export const useSignupUser = () => {
    const dispatch = useDispatch();
    const mutation = useMutation('user-signup', (userCreds: UserSignup) => signupUser(userCreds.email, userCreds.username, userCreds.password), {
        onSuccess: (data: IUserPublicProfileWithToken) => {
            console.log('Got successful response from api:', data);
            data && data.user.emailVerified ? dispatch(login_success(data)) : dispatch(login_success_verification_needed(data));
        },
        onError: (err: Error | AxiosError) => {
            if (err && axios.isAxiosError(err)) {
                const apiError = err as AxiosError<APIError>;
                dispatch(auth_failure(apiError.response?.data));
            } else {
                dispatch(auth_failure({ statusCode: 500, message: err.message }))
            }
        }
    });

    return mutation;
}