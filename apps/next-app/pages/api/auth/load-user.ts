import { request } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { getNewAccessToken, loadUser } from '../../../api/auth';
import http from '../../../axios';

const loadUserRequest =  async (req: NextApiRequest, res: NextApiResponse) => {
    const { method, headers, body } = req;
    try {
        console.log('loadUserRequest: Got request to load user');
        if (method !== 'GET') {
            res.status(404).end();
        }

        console.log('loadUserRequest: Cookies: ', req.headers.cookie, http.defaults.headers);
        http.defaults.headers.cookie = req.headers.cookie || "";
        http.defaults.headers.Authorization = req.headers.Authorization || "";

        if (!http.defaults.headers.cookie) {
            console.log("Returning unauthorized");
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        console.log('Fetching Access token');
        const accessToken = await getNewAccessToken();
        console.log('Setting Access Token Header:', accessToken);
        http.defaults.headers.Authorization = accessToken;

        console.log('HTTP Headers after setting authorization', http.defaults.headers.Authorization);
        const userData = await loadUser()
        res.status(200).json({ ...userData, accessToken });
    } catch (err) {
        console.log('Got error while loading user: ', err.message);
        if (err.message === "Request call failed" || err.message.includes("timeout")) {
            console.log('resetting');
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

export default loadUserRequest;