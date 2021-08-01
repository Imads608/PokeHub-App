import axios from 'axios';

export const axiosSource = axios.CancelToken.source();

export const getRequestHeaderWithToken = (token) => {
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

export const setAuthToken = token => {
    if (token) {
        axios.defaults.headers.common['authorization'] = token;
    } else {
        delete axios.defaults.headers.common['authorization'];
    }
};