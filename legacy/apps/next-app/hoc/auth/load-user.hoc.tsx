/* eslint-disable react/display-name */
import http from '../../axios';
import { getNewAccessToken, loadUser } from '../../api/auth';
import { login_success, login_success_verification_needed } from '../../store/common/common.actions';
import { auth_loaded } from '../../store/auth/auth.reducer';
import { RootStore } from '../../store/store';
import { IncomingMessage, ServerResponse } from 'http';
import { NextApiRequestCookies } from 'next/dist/server/api-utils';

interface IsAuthProps {
    req: IncomingMessage & { cookies: NextApiRequestCookies },
    res: ServerResponse,
    store: RootStore,
    isOAuthLogin: boolean
}

const withLoadUser = (WrappedComponent) => (props) => {
    return <WrappedComponent { ...props } />    
}

withLoadUser.isAuth = async ({ req, res, store, isOAuthLogin } : IsAuthProps) => {
    /**
   * If req is present this function is running on the server
   * The server at this point will _always_ be missing the accessToken because it is stored in the clients memory
   * for that reason we need to correctly set the axios instances cookie header and fetch refreshToken
   */
    if (req) {
        console.log('withLoadUser: Cookies: ', req.headers.cookie);
        http.defaults.headers.cookie = req.headers.cookie || "";
        http.defaults.headers.Authorization = req.headers.Authorization || "";
        try {
            if (!http.defaults.headers.cookie)
                throw new Error("Unauthorized");
            const accessToken = await getNewAccessToken();
            if (!accessToken) {
                throw new Error("No Access Token retrieved");
            }

            http.defaults.headers.Authorization = accessToken;
            const userData = await loadUser()

            if (userData.user.emailVerified)
                store.dispatch(login_success(userData))
            else
                store.dispatch(login_success_verification_needed(userData));

        } catch (e) {
            console.error('withLoadUser: Got error:', e);
            if (!isOAuthLogin)
                store.dispatch(auth_loaded(false));
        }
}
}

export default withLoadUser;