import axios, { CancelTokenSource } from 'axios';

export const axiosSource: CancelTokenSource = axios.CancelToken.source();

export const getRequestHeaderWithToken = (token: string) => {
    return {
        headers: {
            'Content-Type': 'application/json',
            'authorization': token
        }
    }
}

export const getAPIRequestHeader = () => {
    return {
        headers: {
            'Content-Type': 'application/json',
        }
    }
}

export const setAuthToken = (token?: string) => {
    if (token) {
        axios.defaults.headers.common['authorization'] = token;
    } else {
        delete axios.defaults.headers.common['authorization'];
    }
};