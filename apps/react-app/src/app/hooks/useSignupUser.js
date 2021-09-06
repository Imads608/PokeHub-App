import { useMutation } from "react-query";
import { useDispatch } from "react-redux";
import { loggedIn } from "../actions/auth";
import { signupUser } from "../api/auth";


export const useSignupUser = () => {
    const dispatch = useDispatch();
    const mutation = useMutation('user-signup', (userCreds) => signupUser(userCreds.email, userCreds.username, userCreds.password), {
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