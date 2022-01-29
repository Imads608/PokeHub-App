import { NextApiRequest, NextApiResponse } from 'next';
import { getNewAccessToken, loadUser } from '../../../api/auth';
import http from '../../../axios';

const loadUserRequest =  async (req: NextApiRequest, res: NextApiResponse) => {
    const { method, headers, body } = req;

    console.log('loadUserRequest: Got request to load user');
    if (method !== 'GET') {
        res.status(404).end();
    }

    console.log('loadUserRequest: Cookies: ', req.headers.cookie);
    http.defaults.headers.cookie = req.headers.cookie || "";
    http.defaults.headers.Authorization = req.headers.Authorization || "";

    const accessToken = await getNewAccessToken();
    http.defaults.headers.Authorization = accessToken;
    const userData = await loadUser()
    res.status(200).json(userData);
}

export default loadUserRequest;