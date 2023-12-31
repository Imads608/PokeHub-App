import { JwtTokenBody } from "@pokehub/auth/models";

export const AUTH_SERVICE = 'AUTH_SERVICE';

export interface IAuthService {
    /**
    * Validates and Decodes the provided Access Token and returns the User Data associated with it.
    * @param accessToken The Access Token that needs to be decoded and validated
    * @returns An Object containing the encoded User Data
    */
    decodeToken(accessToken: string): Promise<JwtTokenBody>;
}