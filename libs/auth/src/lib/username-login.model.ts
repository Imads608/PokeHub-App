import { Length } from 'class-validator';
import {IUsernameLogin} from './interfaces/username-login.interface';

export class UsernameLogin implements IUsernameLogin {
    username: string;

    @Length(6)
    password: string;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }
}