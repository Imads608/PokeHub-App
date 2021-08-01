import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthService } from 'apps/api-gateway/src/common/auth.service';
import { CreateUserRequest, UserDataWithToken, User, UserData } from '@pokehub/user';
import { AuthTokens, JwtTokenBody } from '@pokehub/auth';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(@Inject("UserMicroservice") private readonly clientProxy: ClientProxy,
                private readonly authService: AuthService) {}

    async createUser(data: CreateUserRequest): Promise<UserDataWithToken> {
        const user = await firstValueFrom(this.clientProxy.send<User>({ cmd: 'create-user' }, data));
        const tokens: { access_token: string, refresh_token: string } = await this.authService.login(user);
        const response = new UserDataWithToken(new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account), tokens.access_token, tokens.refresh_token)
        return response;
    }

    async createUser2(data: CreateUserRequest): Promise<UserDataWithToken> {
        this.logger.log('Sending request to User Microservice');
        const user: UserData = await firstValueFrom(this.clientProxy.send<UserData>({ cmd: 'create-user' }, data));
        this.logger.log(`Got user from User Service: ${JSON.stringify(user)}`);
        const tokens: AuthTokens = await this.authService.generateNewTokens(new JwtTokenBody(user.username, user.email, user.uid));
        const response = new UserDataWithToken(user, tokens.accessToken, tokens.refreshToken);
        return response;
    }

    sendHello(name: string) {
        // Forwards the name to our hello service, and returns the results
        return this.clientProxy.send({ cmd: 'hello' }, name);
      }
}
