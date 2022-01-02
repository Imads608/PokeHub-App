import axios, { AxiosError } from 'axios';
import appConfig from '../config';
import { UserIdTypes } from '@pokehub/user';
import { APIError } from '../types/api';

export const isUsernameAvailable = async (username: string) => {
    try {
        await axios.head(`${appConfig.apiGateway}/users/${username}`, { params: { typeId: UserIdTypes.USERNAME }});
    } catch (err) {
        const apiError = err as AxiosError<APIError>;
        if (apiError.response.data.statusCode === 404)
            return false;
        throw err;
    }
    return true;
};