import axios, { AxiosError, AxiosResponse } from 'axios';
import appConfig from '../config';
import { IUserData, IUserPublicProfile, UserIdTypes } from '@pokehub/user/interfaces';
import { APIError } from '../types/api';
import { getAPIRequestHeader } from './utils';
import http from '../axios';

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

export const isUsernameAvailable = async (username: string) => {
    try {
        await http.head(`/users/${username}`, { params: { typeId: UserIdTypes.USERNAME }});
    } catch (err) {
        const apiError = err as AxiosError<APIError>;
        if (apiError.response.status === 404)
            return true;
        throw err;
    }
    return false;
};

export const isEmailAvailable = async (email: string) => {
    try {
        console.log('isEmailAvailable API: Checking if email',  email, 'exists');
        await http.head(`/users/${email}`, { params: { typeId: UserIdTypes.EMAIL }});
    } catch (err) {
        const apiError = err as AxiosError<APIError>;
        if (apiError.response.status === 404)
            return true;
        throw err;
    }

    return false;
}

export const getUserPublicProfile = async (uid: string) => {
    console.log('HTTP Authorization: ', http.defaults.headers.Authorization);
    const resp: AxiosResponse<IUserPublicProfile> = await http.get(`/users/${uid}`);
    return resp.data;
}

export const updateUser = async (user: IUserData) => {
    const resp: AxiosResponse<IUserData> = await http.put(`/users/${user.uid}`, { user }, getAPIRequestHeader())
    return resp.data;
}

export const setProfileAvatar = async (userId: string, avatar: FormData) => {
    const resp: AxiosResponse<IUserData> = await http.post(`/users/${userId}/avatar`, avatar, { headers: { 'Content-Type': 'multipart/form-data' } });
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


