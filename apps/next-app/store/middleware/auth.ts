import { login_success, logout } from "../actions/common";
import { useInterceptors } from '../../axios';

export const authMiddleware = (store) => (next) => (action) => {
    console.log('Action Type: ', login_success.toString());
    switch (action.type) {
        case login_success.toString():
            console.log('In Login Success')
            localStorage.setItem("pokehub-access-token", action.payload.accessToken);
            localStorage.setItem("pokehub-refresh-token", action.payload.refreshToken);
            console.log('Setting up interceptors');
            useInterceptors();
            break;
        case logout.toString():
            console.log('In Logout')
            localStorage.removeItem("pokehub-access-token");
            localStorage.removeItem("pokehub-refresh-token");
            break;
    }

    next(action);
}