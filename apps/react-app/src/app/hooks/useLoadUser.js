import { useQuery } from "react-query"
import { useDispatch } from "react-redux";
import { appLoaded, requestStarted } from "../actions/app";
import { loggedIn, setAuthLoaded } from "../actions/auth";
import { getNewAccessToken, loadUser } from "../api/auth";
import user from "../reducers/user";

const useLoadUser = (refreshToken) => {
    const dispatch = useDispatch();

    const response = useQuery('user-load', async () => {
        if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
            throw new Error('No Refresh Token provided');
        }
        //dispatch(requestStarted());
        const accessToken = await getNewAccessToken(refreshToken);
        localStorage.setItem('pokehub-access-token', accessToken);
        const user = await loadUser(accessToken);
        return user;
    }, {
        onSuccess: (data) => {
            if (data) {
                console.log('Successful Load User:', data);
                dispatch(loggedIn({
                    ...data,
                    accessToken: localStorage.getItem("pokehub-access-token"),
                    refreshToken: localStorage.getItem('pokehub-refresh-token'),
                }))
            }
        }, 
        onError: () => {
            //dispatch(appLoaded());
            dispatch(setAuthLoaded());
        },
        enabled: true,//refreshToken && refreshToken !== 'undefined' ? true : false,
        retry: false,
        refetchOnWindowFocus: false, refetchOnMount: false, staleTime: Infinity,

    });

    return response;
}

export default useLoadUser