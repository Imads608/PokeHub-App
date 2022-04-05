import { NextApiRequest, NextApiResponse } from 'next';
import { getNewAccessToken, oauthLoad } from '../../../api/auth';
import http from '../../../axios';
import axios from 'axios';
import appConfig from '../../../config';

const oauthLoadRequest =  async (req: NextApiRequest, res: NextApiResponse) => {
    const { method, headers } = req;
    try {
        console.log('oauthLoadRequest: Got request to load user');
        if (method !== 'GET') {
            res.status(404).end();
        }

        const { data, headers: returnedHeaders } = await axios.get(`${appConfig.apiGateway}/users/oauth-load`, { headers });
        Object.keys(returnedHeaders).forEach(key => res.setHeader(key, returnedHeaders[key]));
        res.status(200).json(data);
    } catch (err) {
        console.log('Got error while loading user: ', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

export default oauthLoadRequest;