
import { ICreateUserRequest } from './interfaces/create-user-request.interface';

export class CreateUserRequest implements ICreateUserRequest {
    email: string;
    username: string;
    password: string;
    typeAccount: string;
    firstName?: string;
    lastName?: string;

    constructor(email: string, username: string, typeAccount: string, password: string, firstName?: string, lastName?: string) {
        this.email = email;
        this.username = username;
        this.password = password;
        this.typeAccount = typeAccount;
        this.firstName = firstName;
        this.lastName = lastName;
    }
}