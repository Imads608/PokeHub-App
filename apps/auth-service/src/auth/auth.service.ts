import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserData, UserDataWithToken } from '@pokehub/user'
import { EmailLogin, UsernameLogin, JwtTokenBody, AuthTokens } from '@pokehub/auth';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(@Inject("UserMicroservice") private readonly clientProxy: ClientProxy,
                private readonly jwtService: JwtService, private configService: ConfigService) {}

    async validateUser(username: string, password: string): Promise<UserData> {
        const user: User = await firstValueFrom(this.clientProxy.send<User>({ cmd: 'find-user' }, username));
        this.logger.log(`Response received from User Microservice: ${user}`);
        if (user) {
            const res = await bcrypt.compare(password, user.password);
            const userData = new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account);
            return userData;//if (res) return userData;
        }
        return null;
    }

    async validateAccessToken(accessToken: string): Promise<Boolean> {
        let res = true;
        try {
            await this.jwtService.verifyAsync(accessToken, 
                { secret: this.configService.get<string>('ACCESS_TOKEN_SECRET') });
        } catch (err) {
            res = false;
        }
        return res;
    }

    async getNewAccessToken(refreshToken: string): Promise<{ access_token: string}> {
        const user: { username: string, uid: string } = await this.jwtService.verifyAsync(refreshToken, { secret: this.configService.get<string>('REFRESH_TOKEN_SECRET') })
        return this.login(user.username, user.uid);
    }

    async loginUser(userCreds: EmailLogin | UsernameLogin): Promise<UserDataWithToken> {
        try {
            const user: User = await firstValueFrom(this.clientProxy.send<User>({ cmd: 'find-user' }, userCreds));
            this.logger.log(`Response received from User Microservice: ${user}`);
            if (user) {
                const res = await bcrypt.compare(userCreds.password, user.password);
                if (res) {
                    const tokens = await this.generateNewTokens(new JwtTokenBody(user.username, user.email, user.uid));
                    return new UserDataWithToken(new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account), tokens.accessToken, tokens.refreshToken);
                }
            }
            return null;
        } catch (err) {
            throw new RpcException("Internal Server Error");
        }
        
    }

    async generateNewTokens(userJwt: JwtTokenBody): Promise<AuthTokens> {
        const accessToken = this.jwtService.sign(userJwt, {
            secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
            expiresIn: `${this.configService.get<string>('ACCESS_TOKEN_EXPIRATION_SECONDS')}s`
        });
        const refreshToken = this.jwtService.sign(userJwt, {
            secret: this.configService.get<string>('REFRESH_TOKEN_SECRET')
        });

        return new AuthTokens(accessToken, refreshToken);
    }

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
    }
}
