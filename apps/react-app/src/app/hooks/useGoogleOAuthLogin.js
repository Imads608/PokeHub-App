import { useMutation, useQuery } from "react-query";
import { useDispatch } from "react-redux"
import { authFailure, loggedIn } from "../actions/auth";
import { googleOAuthLogin } from '../api/auth';

export const useGoogleOAuthLogin = () => {
    const dispatch = useDispatch();
    const mutation = useMutation('google-oauth', (token) => googleOAuthLogin(token), {
        onSuccess: (data) => {
            console.log('Got successful response from api:', data);
            data && dispatch(loggedIn(data))
        },
        onError: (data) => {
            console.log('Got error from server:', data);
            data && dispatch(authFailure(data))
        }
    });

    return mutation;
}