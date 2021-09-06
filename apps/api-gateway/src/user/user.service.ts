import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthService } from 'apps/api-gateway/src/common/auth.service';
import { CreateUserRequest, UserDataWithToken, User, UserData, UserPublicProfile } from '@pokehub/user';
import { AuthTokens, JwtTokenBody } from '@pokehub/auth';
import { RoomService } from '../chat/common/room.service';
import { ChatRoom } from '@pokehub/room';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(@Inject("UserMicroservice") private readonly clientProxy: ClientProxy,
                private readonly authService: AuthService, private readonly roomService: RoomService) {}

    async createUserOld(data: CreateUserRequest): Promise<UserDataWithToken> {
        const user = await firstValueFrom(this.clientProxy.send<User>({ cmd: 'create-user' }, data));
        //const tokens: { access_token: string, refresh_token: string } = await this.authService.login(user);
        //const response = new UserDataWithToken(new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account), tokens.access_token, tokens.refresh_token)
        return null;//return response;
    }

    
    async loadUser(uid: string): Promise<UserPublicProfile> {
        return await this.getUserData(uid);
    }

    async googleOAuthLogin() {
        
    }

    async createUser(data: CreateUserRequest): Promise<UserDataWithToken> {
        this.logger.debug('Got request to create new user. Sending to User Microservice: ' + JSON.stringify(data));
        const user: UserData = await firstValueFrom(this.clientProxy.send<UserData>({ cmd: 'create-user' }, data));
        this.logger.log(`Got user from User Service: ${JSON.stringify(user)}`);
        const tokens: AuthTokens = await this.authService.generateNewTokens(new JwtTokenBody(user.username, user.email, user.uid));
        const response = new UserDataWithToken(user, tokens.accessToken, tokens.refreshToken);
        return response;
    }

    private async getUserData(uid: string): Promise<UserPublicProfile> {
        // Get User Details
        const userData: UserData = await firstValueFrom(this.clientProxy.send<UserData>({ cmd: 'find-user' }, uid));

        // Get Joined Public Rooms
        const rooms: ChatRoom[] = await this.roomService.getJoinedPublicRoomsForUser(uid);

        // Get DMs
        return new UserPublicProfile(userData, rooms);
    }
}
