import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserRequest, TypeAccount, User, UserData, UserDataWithToken } from '@pokehub/user'
import { EmailLogin, UsernameLogin, JwtTokenBody, AuthTokens } from '@pokehub/auth';
import { ConfigService } from '@nestjs/config';
import { LoginTicket, OAuth2Client, TokenPayload } from 'google-auth-library';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private client: OAuth2Client;

    constructor(@Inject("UserMicroservice") private readonly clientProxy: ClientProxy,
                private readonly jwtService: JwtService, private configService: ConfigService) {
                    this.client = new OAuth2Client('');
                }

    /*
    async validateUser(username: string, password: string): Promise<UserData> {
        const user: User = await firstValueFrom(this.clientProxy.send<User>({ cmd: 'find-user' }, username));
        this.logger.log(`Response received from User Microservice: ${user}`);
        if (user) {
            const res = await bcrypt.compare(password, user.password);
            const userData = new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified);
            return userData;//if (res) return userData;
        }
        return null;
    }*/

    async googleOAuthLogin(tokenId: string): Promise<UserDataWithToken> {
        const userDetails: LoginTicket = await this.client.verifyIdToken({ idToken: tokenId, audience: '490564752077-hlbp1k70hlsqo1quibgmcpetanscrpqu.apps.googleusercontent.com'});
        const payload: TokenPayload = userDetails.getPayload()
        this.logger.log('User Details: ' + JSON.stringify(userDetails));
        this.logger.log('Payload: ' + JSON.stringify(payload));
        const createReq = new CreateUserRequest(payload.email, "testOAuth", TypeAccount.GOOGLE.toString(), `${payload.email} + ${this.configService.get<string>('ACCESS_TOKEN_SECRET')}`, payload.given_name, payload.family_name);
        const userData = await firstValueFrom(this.clientProxy.send<UserData>({ cmd: 'google-oauth-login' }, createReq));
        const tokens = await this.generateNewTokens(new JwtTokenBody(userData.username, userData.email, userData.uid));

        this.logger.debug("Got user data from user-service:", JSON.stringify(userData));
        return new UserDataWithToken(userData, tokens.accessToken, tokens.refreshToken);
    }

    async validateAccessToken(accessToken: string): Promise<Boolean> {
        let res = true;
        try {
            this.logger.log("Validating access token");
            await this.jwtService.verifyAsync(accessToken, 
                { secret: this.configService.get<string>('ACCESS_TOKEN_SECRET') });
        } catch (err) {
            res = false;
        }
        return res;
    }

    async decodeToken(accessToken: string): Promise<JwtTokenBody> {
        try {
            const jwtBody: JwtTokenBody = await this.jwtService.verifyAsync(accessToken, { secret: this.configService.get<string>('ACCESS_TOKEN_SECRET') });
            return jwtBody;
        } catch (err) {
            throw new RpcException("User is unauthorized");
        }
    }

    async getNewAccessToken(refreshToken: string): Promise<{ access_token: string}> {
        try {
            this.logger.debug("Refresh Token provided: " + refreshToken);
            this.logger.debug("REFRESH_SECRET: " + this.configService.get<string>('REFRESH_TOKEN_SECRET'));
            const user: { username: string, uid: string, email: string } = await this.jwtService.verifyAsync(refreshToken, { secret: this.configService.get<string>('REFRESH_TOKEN_SECRET') })
            this.logger.debug("Decoded user: " + JSON.stringify(user));
            const accessToken = this.jwtService.sign({ username: user.username, uid: user.uid, email: user.email }, {
                secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
                expiresIn: `${this.configService.get<string>('ACCESS_TOKEN_EXPIRATION_SECONDS')}s`
            });
            return { access_token: accessToken };
        } catch (err) {
            if (err.message.includes("expired"))
                throw new RpcException("User is not authorized");
            this.logger.error(`Got error getting new access token: ${err}`)
            throw new RpcException("Internal Server Error");
        }
    }

    /*
    async loginUser(userCreds: EmailLogin | UsernameLogin): Promise<UserDataWithToken> {
        try {
            const username = (userCreds as UsernameLogin).username;
            const user: User = await firstValueFrom(this.clientProxy.send<User>({ cmd: 'find-user' }, username));
            this.logger.log(`Response received from User Microservice: ${user}`);
            if (user) {
                const res = await bcrypt.compare(userCreds.password, user.password);
                if (res) {
                    const tokens = await this.generateNewTokens(new JwtTokenBody(user.username, user.email, user.uid));
                    return new UserDataWithToken(new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified), tokens.accessToken, tokens.refreshToken);
                }
            } else throw new RpcException('Invalid Credentials');
            return null;
        } catch (err) {
            throw new RpcException("Internal Server Error");
        }
        
    }*/

    async emailLogin(userCreds: EmailLogin): Promise<UserDataWithToken> {
        try {
            const user: User = await firstValueFrom(this.clientProxy.send<User>({ cmd: 'find-user-email' }, userCreds.email));
            this.logger.log(`Response received from User Microservice`);
            const isValidated: Boolean = await this.validateCreds(user, userCreds.password);
            if (isValidated) {
                const tokens = await this.generateNewTokens(new JwtTokenBody(user.username, user.email, user.uid));
                return new UserDataWithToken(new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified), tokens.accessToken, tokens.refreshToken);
            }
            throw new RpcException("Invalid Credentials");
        } catch (err) {
            this.logger.error(`Got exception trying to login user by email: ${err}`);
            if (err.message && err.message.includes("Invalid Credentials"))
                throw err;
            throw new RpcException("Internal Server Error");
        }
        
    }

    async usernameLogin(userCreds: UsernameLogin): Promise<UserDataWithToken> {
        try {
            const user: User = await firstValueFrom(this.clientProxy.send<User>({ cmd: 'find-user-username' }, userCreds.username));
            this.logger.log(`Response received from User Microservice: ${user}`);
            const isValidated: Boolean = await this.validateCreds(user, userCreds.password);
            if (isValidated) {
                const tokens = await this.generateNewTokens(new JwtTokenBody(user.username, user.email, user.uid));
                return new UserDataWithToken(new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified), tokens.accessToken, tokens.refreshToken);
            }
            throw new RpcException("Invalid Credentials");
        } catch (err) {
            this.logger.error(`Got exception trying to login user by username: ${err}`);
            throw new RpcException("Internal Server Error");
        }
    }

    async generateNewTokens(userJwt: JwtTokenBody): Promise<AuthTokens> {
        const payload = { username: userJwt.username, email: userJwt.email, uid: userJwt.uid };
        this.logger.debug('Payload for generating new access tokens: ' + payload);
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
            expiresIn: `${this.configService.get<string>('ACCESS_TOKEN_EXPIRATION_SECONDS')}s`
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
            expiresIn: "2 days"
        });

        return new AuthTokens(accessToken, refreshToken);
    }

    /*
    async login(username: string, uid: string): Promise<{ access_token: string, refresh_token: string }> {
        const payload = {username, sub: uid };
        return {
            access_token: this.jwtService.sign(payload, {
                secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
                expiresIn: `${this.configService.get<string>('ACCESS_TOKEN_EXPIRATION_SECONDS')}s`
            }),
            refresh_token: this.jwtService.sign(payload, {
                secret: this.configService.get<string>('REFRESH_TOKEN_SECRET')
            })
        }
    }*/

    private async validateCreds(userFromDB: User, passwordUsed: string): Promise<Boolean> {
        if (userFromDB) {
            const res = await bcrypt.compare(passwordUsed, userFromDB.password);
            if (res) {
                return true;
            }
        }

        this.logger.log('User credentials provided are invalid: ' + JSON.stringify(userFromDB));
        return false;
    }
}
