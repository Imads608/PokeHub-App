/* eslint-disable react/display-name */
import http from '../../axios';
import { login_success, login_success_verification_needed } from '../../store/actions/common';
import { auth_loaded } from '../../store/reducers/auth';
import { RootStore } from '../../store/store';
import { IncomingMessage, ServerResponse } from 'http';
import { NextApiRequestCookies } from 'next/dist/server/api-utils';
import axios from 'axios';
import appConfig from '../../config';
import { IUserProfileWithToken } from '@pokehub/user/interfaces';

interface IsAuthProps {
    req: IncomingMessage & { cookies: NextApiRequestCookies },
    res: ServerResponse,
    store: RootStore,
    oauthToken: string
}

const withOAuthLoad = (WrappedComponent) => (props) => {
    return <WrappedComponent { ...props } />    
}

withOAuthLoad.isAuth = async ({ req, res, store, oauthToken } : IsAuthProps) => {
    /**
   * If req is present this function is running on the server
   * The server at this point will _always_ be missing the accessToken because it is stored in the clients memory
   * for that reason we need to correctly set the axios instances cookie header and fetch refreshToken
   */
    if (req) {
        try {
            console.log('withOAuthLoad: Logging in OAuth User');
            const { data, headers: returnedHeaders } = await axios.get(`${appConfig.apiGateway}/users/oauth-load`, { headers: { Authorization: oauthToken } });
            console.log('withOAuthLoad', JSON.stringify(returnedHeaders));
            res.setHeader('set-cookie', returnedHeaders['set-cookie']);
            http.defaults.headers.Authorization = (data as IUserProfileWithToken).accessToken;
            console.log(`withOAuthLoad: Defaults: ${http.defaults.headers.Authorization}, ${(data as IUserProfileWithToken).accessToken}`);
            store.dispatch(login_success(data as IUserProfileWithToken))
        } catch (e) {
            console.error('withLoadUser: Got error:', e);
            store.dispatch(auth_loaded(false));
        }
    }
}

export default withOAuthLoad;