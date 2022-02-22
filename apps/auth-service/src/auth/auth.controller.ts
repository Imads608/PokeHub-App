import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { UserDataWithToken } from '@pokehub/user/models';
import { EmailLogin, UsernameLogin, JwtTokenBody, AuthTokens } from '@pokehub/auth/models';
import { AUTH_SERVICE, IAuthService } from './auth-service.interface';
import { AppLogger } from '@pokehub/common/logger';
import { TCPEndpoints } from '@pokehub/auth/interfaces';
import { IJwtAuthService, JWT_AUTH_SERVICE } from '../common/jwt-auth-service.interface';

@Controller()
export class AuthController {
    constructor( @Inject(JWT_AUTH_SERVICE) private readonly authService: IJwtAuthService, private readonly logger: AppLogger ) {
        this.logger.setContext(AuthController.name);
    }
    /*
    @MessagePattern({ cmd: TCPEndpoints.EMAIL_LOGIN }, Transport.TCP)
    async emailLogin(user: EmailLogin): Promise<UserDataWithToken> {
        this.logger.log( `emailLogin: Got request to login user with Email ${user.email}` );
        return await this.authService.emailLogin(user);
    }

    @MessagePattern({ cmd: TCPEndpoints.USERNAME_LOGIN }, Transport.TCP)
    async usernameLogin(user: UsernameLogin): Promise<UserDataWithToken> {
        this.logger.log( `usernameLogin: Got request to login user by Username ${user.username}` );
        return await this.authService.usernameLogin(user);
    }

    @MessagePattern({ cmd: TCPEndpoints.GOOGLE_OAUTH_LOGIN }, Transport.TCP)
    async googleOAuthLogin(token: string) {
        this.logger.log( `googleOAuthLogin: Got request to login user with Google OAuth` );
        return await this.authService.googleOAuthLogin(token);
    }*/

    @MessagePattern({ cmd: TCPEndpoints.VALIDATE_ACCESS_TOKEN }, Transport.TCP)
    async validateAccessToken(accessToken: string): Promise<boolean> {
        this.logger.log( 'validateAccessToken: Got request to validate provided access token' );
        return await this.authService.validateAccessToken(accessToken);
    }

    @MessagePattern( { cmd: TCPEndpoints.VALIDATE_EMAIL_CONFIRMATION_TOKEN }, Transport.TCP )
    async validateEmailConfirmationToken(verificationToken: string): Promise<JwtTokenBody> {
        this.logger.log( 'validateEmailConfirmationToken: Got request to validate provided Email Verification Token' );
        return await this.authService.validateEmailVerificationToken(verificationToken);
    }

    @MessagePattern( { cmd: TCPEndpoints.VALIDATE_PASSWORD_RESET_TOKEN }, Transport.TCP )
    async validatePasswordResetToken(passwordResetToken: string): Promise<{ email: string }> {
        this.logger.log( 'validatePasswordResetToken: Got request to validate provided Password Reset Token' );
        return await this.authService.validatePasswordResetToken(passwordResetToken);
    }

    @MessagePattern({ cmd: TCPEndpoints.DECODE_TOKEN }, Transport.TCP)
    async decodeToken(accessToken: string): Promise<JwtTokenBody> {
        this.logger.log('decodeToken: Got request to Decode Access Token');
        return await this.authService.decodeToken(accessToken);
    }

    /*
    @MessagePattern({ cmd: TCPEndpoints.GENERATE_TOKENS }, Transport.TCP)
    async generateTokens(userInfo: JwtTokenBody): Promise<AuthTokens> {
        this.logger.log( `generateTokens: Got request to generate tokens for user with uid ${userInfo.uid}` );
        return await this.authService.generateNewTokens(userInfo);
    }
    */
   
    @MessagePattern({ cmd: TCPEndpoints.GET_ACCESS_TOKEN }, Transport.TCP)
    async getNewAccessToken(refreshToken: string): Promise<{ access_token: string }> {
        this.logger.log('getNewAccessToken: Got request to generate access token');
        return await this.authService.getNewAccessToken(refreshToken);
    }

    @MessagePattern( { cmd: TCPEndpoints.GET_EMAIL_VERIFICATION_TOKEN }, Transport.TCP )
    async getEmailVerificationToken( userData: JwtTokenBody ): Promise<{ email_verification_token: string }> {
        this.logger.log( 'getEmailVerificationToken: Got request to generate new Email Verification Token' );
        return await this.authService.getNewEmailVerificationToken(userData);
    }

    @MessagePattern( { cmd: TCPEndpoints.GET_PASSWORD_RESET_TOKEN }, Transport.TCP )
    async getPasswordResetToken( userData: { email: string } ): Promise<{ password_reset_token: string }> {
        this.logger.log( `getPasswordResetToken: Got request to generate new Password Reset Token for ${userData.email}` );
        return await this.authService.getNewPasswordResetToken(userData);
    }
}
