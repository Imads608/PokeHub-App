import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { User, UserData, CreateUserRequest, UserDataWithToken } from '@pokehub/user';
import { UsernameLogin, EmailLogin, AuthTokens, JwtTokenBody } from '@pokehub/auth';


@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    
    constructor(@Inject("AuthMicroservice") private readonly clientProxy: ClientProxy) {}

    async validateUser(username: string, password: string) {
        this.logger.log('Sending validation request to Auth Service: validate-user');
        return await firstValueFrom(this.clientProxy.send<User>({ cmd: 'validate-user' }, { username, password}));
    }

    async login(user: User): Promise<{ access_token: string, refresh_token: string }> {
        return await firstValueFrom(this.clientProxy.send<{ access_token: string, refresh_token: string}>({ cmd: 'login-user'}, user));
    }

    async loginUser(userCreds: EmailLogin | UsernameLogin) {
        return await firstValueFrom(this.clientProxy.send<UserDataWithToken>({ cmd: 'login-user2' }, userCreds));
    }

    async generateNewTokens(user: JwtTokenBody): Promise<AuthTokens> {
        this.logger.log('Going to generate tokens for user');
        return await firstValueFrom(this.clientProxy.send<AuthTokens>({ cmd: 'generate-tokens' }, user));
    } 

    async validateAccessToken(accessToken: string): Promise<Boolean> {
        this.logger.log('Sending Access Token Validation Request to Auth Service: validate-accessToken');
        return await firstValueFrom(this.clientProxy.send<Boolean>({ cmd: 'validate-accessToken' }, accessToken));
    }

    async getNewAccessToken(refreshToken: string): Promise<{ access_token: string}> {
        this.logger.log('Sending Request for New Access Token to Auth Service: get-accessToken');
        return await firstValueFrom(this.clientProxy.send<{access_token: string}>({ cmd: 'get-accessToken' }, refreshToken));
    }

}
