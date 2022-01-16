import axios, { AxiosError, AxiosResponse } from 'axios';
import appConfig from '../config';
import { IUserData, UserIdTypes } from '@pokehub/user/interfaces';
import { APIError } from '../types/api';
import { getAPIRequestHeader } from './utils';

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

export const isUsernameAvailable = async (username: string) => {
    try {
        await axios.head(`${appConfig.apiGateway}/users/${username}`, { params: { typeId: UserIdTypes.USERNAME }});
    } catch (err) {
        const apiError = err as AxiosError<APIError>;
        if (apiError.response.status === 404)
            return true;
        throw err;
    }
    return false;
};

export const updateUser = async (user: IUserData) => {
    const resp: AxiosResponse<IUserData> = await axios.put(`${appConfig.apiGateway}/users/${user.uid}`, { user }, getAPIRequestHeader())
    return resp.data;
}

export const setProfileAvatar = async (userId: string, avatar: FormData) => {
    const resp: AxiosResponse<IUserData> = await axios.post(`${appConfig.apiGateway}/users/${userId}/avatar`, avatar, { headers: { 'Content-Type': 'multipart/form-data' } });
    return resp.data;
}

export const updateUserFake = (user: IUserData) => 
  new Promise((resolve, reject) =>
    setTimeout(() => {
      const rand = getRandomInt(10);
      if (rand < 5) reject({ message: 'Internal Server Error' });
      resolve(user);
    }, 1000)
  );

export const setProfileAvatarFake = (userId: string, avatar: FormData) => 
    new Promise((resolve, reject) =>
        setTimeout(() => {
            const rand = getRandomInt(10);
            if (rand < 5) reject({ message: 'Internal Server Error' });
            resolve({
                uid: userId,
                email: 'tidal608@gmail.com',
                username: 'tidal608',
                account: 'regular',
                emailVerified: true
            });
        }, 1000)
    );


