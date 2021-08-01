import { IsEmail, Length } from 'class-validator';

export class EmailLogin {

    @IsEmail()
    email: string;

    @Length(6)
    password: string;

    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
    }
}