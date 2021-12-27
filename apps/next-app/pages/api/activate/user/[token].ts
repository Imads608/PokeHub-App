import Cors from 'cors';
import appConfig from '../../../../config';
import axios from 'axios';

// Initializing the cors middleware
const cors = Cors({
    methods: ['GET', 'HEAD'],
});

export default async function handler(req, res) {
    // Validate Token
    const { token } = req.query;
    await axios.put(`${appConfig.apiGateway}/users/validation`);

    // Redirect User to Activation Page
    res.redirect(307, '/users/activated');
}