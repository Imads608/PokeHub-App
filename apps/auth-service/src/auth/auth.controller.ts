import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { UserDataWithToken } from '@pokehub/user';
import { EmailLogin, UsernameLogin, JwtTokenBody, AuthTokens, TCPEndpoints } from '@pokehub/auth'; 
import { AUTH_SERVICE, IAuthService } from './auth-service.interface';
import { AppLogger } from '@pokehub/logger';

@Controller()
export class AuthController {
    constructor(@Inject(AUTH_SERVICE) private readonly authService: IAuthService, 
                private readonly logger: AppLogger) {
        this.logger.setContext(AuthController.name);
    }

    @MessagePattern({ cmd: TCPEndpoints.EMAIL_LOGIN }, Transport.TCP)
    emailLogin(user: EmailLogin): Promise<UserDataWithToken> {
        this.logger.log(`emailLogin: Got request to login user with Email ${user.email}`);
        return this.authService.emailLogin(user);
    }

    @MessagePattern({ cmd: TCPEndpoints.USERNAME_LOGIN }, Transport.TCP)
    usernameLogin(user: UsernameLogin): Promise<UserDataWithToken> {
        this.logger.log(`usernameLogin: Got request to login user by Username ${user.username}`);
        return this.authService.usernameLogin(user);
    }

    @MessagePattern({ cmd: TCPEndpoints.GOOGLE_OAUTH_LOGIN }, Transport.TCP)
    googleOAuthLogin(token: string) {
        this.logger.log(`googleOAuthLogin: Got request to login user with Google OAuth`);
        return this.authService.googleOAuthLogin(token);
    }

    @MessagePattern({ cmd: TCPEndpoints.VALIDATE_ACCESS_TOKEN }, Transport.TCP)
    validateAccessToken(accessToken: string): Promise<boolean> {
        this.logger.log('validateAccessToken: Got request to validate provided access token');
        return this.authService.validateAccessToken(accessToken);
    }

    @MessagePattern({ cmd: TCPEndpoints.VALIDATE_EMAIL_CONFIRMATION_TOKEN }, Transport.TCP)
    validateEmailConfirmationToken(accessToken: string): Promise<JwtTokenBody> {
        this.logger.log('validateEmailConfirmationToken: Got request to validate provided Email Verification Token');
        return this.authService.validateEmailVerificationToken(accessToken);
    }

    @MessagePattern({ cmd: TCPEndpoints.DECODE_TOKEN }, Transport.TCP)
    decodeToken(accessToken: string): Promise<JwtTokenBody> {
        this.logger.log('decodeToken: Got request to Decode Access Token');
        return this.authService.decodeToken(accessToken);
    }

    @MessagePattern({ cmd: TCPEndpoints.GENERATE_TOKENS }, Transport.TCP)
    generateTokens(userInfo: JwtTokenBody): Promise<AuthTokens> {
        this.logger.log(`generateTokens: Got request to generate tokens for user with uid ${userInfo.uid}`);
        return this.authService.generateNewTokens(userInfo);
    }

    @MessagePattern({ cmd: TCPEndpoints.GET_ACCESS_TOKEN }, Transport.TCP)
    getNewAccessToken(refreshToken: string): Promise<{ access_token: string }> {
        this.logger.log("getNewAccessToken: Got request to generate access token");
        return this.authService.getNewAccessToken(refreshToken);
    }

    @MessagePattern({ cmd: TCPEndpoints.GET_EMAIL_VERIFICATION_TOKEN }, Transport.TCP)
    getEmailVerificationToken(userData: JwtTokenBody): Promise<{ email_verification_token: string }> {
        this.logger.log("getEmailVerificationToken: Got request to generate new Email Verification Token");
        return this.authService.getNewEmailVerificationToken(userData);
    }
}
