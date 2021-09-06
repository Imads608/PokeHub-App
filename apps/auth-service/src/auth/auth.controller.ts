import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { UserDataWithToken, UserData } from '@pokehub/user';
import { EmailLogin, UsernameLogin, JwtTokenBody, AuthTokens } from '@pokehub/auth'; 
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

@Controller()
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService, private readonly jwtService: JwtService) {}

    /*
    @MessagePattern({ cmd: 'validate-user' }, Transport.TCP)
    validateUser(user: {username: string, password: string }): Promise<UserData> {
        this.logger.log('Got request to validate user');
        return this.authService.validateUser(user.username, user.password);
    }

    @MessagePattern({ cmd: 'login-user' }, Transport.TCP)
    loginUser(user: { username: string, uid: string}): Promise<{ access_token: string, refresh_token: string }> {
        return this.authService.login(user.username, user.uid)
    }

    @MessagePattern({ cmd: 'login-user' }, Transport.TCP)
    loginUser2(user: EmailLogin | UsernameLogin): Promise<UserDataWithToken> {
        this.logger.log('Got request to validate user credentials' + JSON.stringify(user));
        return this.authService.loginUser(user);
    }*/

    @MessagePattern({ cmd: 'email-login' }, Transport.TCP)
    emailLogin(user: EmailLogin): Promise<UserDataWithToken> {
        this.logger.debug('Got request to login user by email');
        return this.authService.emailLogin(user);
    }

    @MessagePattern({ cmd: 'username-login' }, Transport.TCP)
    usernameLogin(user: UsernameLogin): Promise<UserDataWithToken> {
        this.logger.debug('Got request to login user by username');
        return this.authService.usernameLogin(user);
    }

    @MessagePattern({ cmd: 'google-oauth-login' }, Transport.TCP)
    googleOAuthLogin(token: string) {
        this.logger.debug('Got request to login user with OAuth');
        return this.authService.googleOAuthLogin(token);
    }

    @MessagePattern({ cmd: 'validate-accessToken' }, Transport.TCP)
    validateAccessToken(accessToken: string): Promise<Boolean> {
        return this.authService.validateAccessToken(accessToken);
    }

    @MessagePattern({ cmd: 'decode-token' }, Transport.TCP)
    decodeToken(accessToken: string): Promise<JwtTokenBody> {
        return this.authService.decodeToken(accessToken);
    }

    @MessagePattern({ cmd: 'generate-tokens' }, Transport.TCP)
    generateTokens(userInfo: JwtTokenBody): Promise<AuthTokens> {
        this.logger.log("Got request to generate tokens for user: " + JSON.stringify(userInfo));
        return this.authService.generateNewTokens(userInfo);
    }

    @MessagePattern({ cmd: 'get-accessToken' }, Transport.TCP)
    getNewAccessToken(refreshToken: string): Promise<{ access_token: string }> {
        return this.authService.getNewAccessToken(refreshToken);
    }
}
