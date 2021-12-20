import { useQuery, UseQueryResult } from "react-query"
import { useDispatch } from "react-redux"
//import { authFailure, loggedIn, setAuthLoaded } from "../actions/auth";
import { login_success, auth_failure } from '../../actions/common';
import { loginUser } from "../../api/auth"
import axios, { AxiosError } from 'axios';
import { IUserPublicProfileWithToken } from "@pokehub/user";
import { APIError } from "../../types/api";
import { Dispatch } from "redux";

const useLoginUser = (userId: string, password: string, enable: boolean) => {
    
    const dispatch: Dispatch = useDispatch();
    const res: UseQueryResult<IUserPublicProfileWithToken, Error | AxiosError<APIError>> = useQuery('user-login', async () => await loginUser(userId, password), {
        onSuccess: (userData: IUserPublicProfileWithToken) => {
            console.log('Success on Login:', userData);
            userData && dispatch(login_success(userData));
        }, 
        onError: (err: Error | AxiosError<APIError> ) => {
            console.log('Got error: ', err);
            if (err && axios.isAxiosError(err)) {
                const apiError = err as AxiosError<APIError>;
                dispatch(auth_failure(apiError.response?.data));
            } else {
                dispatch(auth_failure({ statusCode: 500, message: err.message }))
            }
        },

        enabled: enable ? true : false,
        retry: false,
        refetchOnWindowFocus: false, refetchOnMount: true, staleTime: 30000,
    })

    return res;
}

export default useLoginUser;