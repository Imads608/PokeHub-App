import { TypeAccount } from "@pokehub/user";

export interface IUser {
    uid: string;
    username: string;
    firstName: string;
    lastName?: string;
    password?: string;
    email: string;
    emailVerified: boolean;
    account: TypeAccount;
}