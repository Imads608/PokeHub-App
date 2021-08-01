import { Length } from 'class-validator';

export class UsernameLogin {
    username: string;

    @Length(6)
    password: string;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }
}