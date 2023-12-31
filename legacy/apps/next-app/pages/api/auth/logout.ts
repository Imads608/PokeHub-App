import { NextApiRequest, NextApiResponse } from 'next';
import http from '../../../axios';
import axios from 'axios';
import appConfig from '../../../config';

const logoutRequest =  async (req: NextApiRequest, res: NextApiResponse) => {
    const { method, headers, body } = req;

    console.log('logoutRequest: Got request to load user');
    if (method !== 'POST') {
        res.status(404).end();
    }
    try {
        console.log(headers);
        const { data, headers: returnedHeaders } = await axios.post(`${appConfig.apiGateway}/auth/logout`, undefined, { headers });
        Object.keys(returnedHeaders).forEach(key => res.setHeader(key, returnedHeaders[key]));
        res.status(200).json(data);
      } catch (e) {
        const { response } = e;
        const { status, data } = response;
        console.log(response);
        res.status(status).json(data);
      }
}

export default logoutRequest;