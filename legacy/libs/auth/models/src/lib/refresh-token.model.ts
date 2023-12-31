import { IRefreshToken } from '@pokehub/auth/interfaces'

export class RefreshToken implements IRefreshToken {
    token: string;
    expirySeconds: number;

    constructor(token: string, expirySeconds: number) {
        this.token = token;
        this.expirySeconds = expirySeconds;
    }
}