import { Body, Controller, Get, Logger, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from '../common/auth.service';
import { LoginInterceptor } from './login.interceptor';
import { UsernameLogin, EmailLogin } from '@pokehub/auth';
import { AuthGuard } from '@nestjs/passport';
import { UserData, UserDataWithToken, UserPublicProfileWithToken } from '@pokehub/user';
import { GoogleAuth } from 'google-auth-library';
import { OauthInterceptor } from './oauth.interceptor';
import { RoomService } from '../chat/common/room.service';

@Controller()
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    
    constructor(private readonly authService: AuthService, private readonly roomService: RoomService) {}

    //@UseInterceptors(AuthInterceptor)
    /*@UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user);
    }*/

    @UseInterceptors(LoginInterceptor)
    @Post('login')
    async login(@Body() loginCreds: UsernameLogin | EmailLogin): Promise<UserPublicProfileWithToken> {
        this.logger.debug('Got request to login user');
        const userWithToken = await this.authService.loginUser(loginCreds);
        const joinedRooms = await this.roomService.getJoinedPublicRoomsForUser(userWithToken.user.uid);
        return new UserPublicProfileWithToken(userWithToken.user, userWithToken.accessToken, userWithToken.refreshToken, joinedRooms);
    }

    @UseInterceptors(OauthInterceptor)
    @Post('oauth-google')
    async googleOAuthLogin(@Req() req: Request): Promise<UserPublicProfileWithToken> {
        this.logger.debug('Got request to login/create with OAuth Google', JSON.stringify(req.headers));
        const userWithToken: UserDataWithToken = await this.authService.googleOAuthLogin(req.headers["authorization"]);
        const joinedRooms = await this.roomService.getJoinedPublicRoomsForUser(userWithToken.user.uid);
        return new UserPublicProfileWithToken(userWithToken.user, userWithToken.accessToken, userWithToken.refreshToken, joinedRooms);
    }

    @UseInterceptors(LoginInterceptor)
    @Get('access-token')
    async getAccessToken(@Req() req: Request) {
        return await this.authService.getNewAccessToken(req.headers["authorization"]);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleLogin(@Req() req) {
    }

    @Get('redirect')
    @UseGuards(AuthGuard('google'))
    googleAuthRedirect(@Req() req) {
        return 'okay';
    }
}
