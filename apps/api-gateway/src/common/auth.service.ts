import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { User, UserData, CreateUserRequest, UserDataWithToken } from '@pokehub/user';
import { UsernameLogin, EmailLogin, AuthTokens, JwtTokenBody } from '@pokehub/auth';


@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    
    constructor(@Inject("AuthMicroservice") private readonly clientProxy: ClientProxy) {}

    /*
    async validateUser(username: string, password: string) {
        this.logger.log('Sending validation request to Auth Service: validate-user');
        return await firstValueFrom(this.clientProxy.send<User>({ cmd: 'validate-user' }, { username, password}));
    }

    async login(user: User): Promise<{ access_token: string, refresh_token: string }> {
        return await firstValueFrom(this.clientProxy.send<{ access_token: string, refresh_token: string}>({ cmd: 'login-user'}, user));
    }*/

    async googleOAuthLogin(token: string): Promise<UserDataWithToken> {
        if (!token)
            throw new UnauthorizedException();
        const userDataWithToken = await firstValueFrom(this.clientProxy.send<UserDataWithToken>({ cmd: 'google-oauth-login' }, token));
        return userDataWithToken;
    }

    async loginUser(userCreds: EmailLogin | UsernameLogin): Promise<UserDataWithToken> {

        this.logger.debug('Going to login user');
        
        if (this.isEmailLogin(userCreds)) {
            return await firstValueFrom(this.clientProxy.send<UserDataWithToken>({ cmd: 'email-login' }, userCreds));
        } else if (this.isUsernameLogin(userCreds)) {
            return await firstValueFrom(this.clientProxy.send<UserDataWithToken>({ cmd: 'username-login' }, userCreds));
        } else {
            throw new BadRequestException();
        }
    }

    async generateNewTokens(user: JwtTokenBody): Promise<AuthTokens> {
        this.logger.log('Going to generate tokens for user');
        return await firstValueFrom(this.clientProxy.send<AuthTokens>({ cmd: 'generate-tokens' }, user));
    } 

    async decodeToken(accessToken: string): Promise<JwtTokenBody> {
        this.logger.log('Sending Access Token Validation Request to Auth Service: validate-accessToken: ' + accessToken);
        return await firstValueFrom(this.clientProxy.send<UserData>({ cmd: 'decode-token' }, accessToken));
    }

    async getNewAccessToken(refreshToken: string): Promise<{ access_token: string}> {
        this.logger.log('Sending Request for New Access Token to Auth Service: get-accessToken');
        return await firstValueFrom(this.clientProxy.send<{access_token: string}>({ cmd: 'get-accessToken' }, refreshToken));
    }

    private isEmailLogin(userCreds: any): Boolean {
        return userCreds.email !== undefined;
    }

    private isUsernameLogin(userCreds: any): Boolean {
        return userCreds.username !== undefined;
    }

}
