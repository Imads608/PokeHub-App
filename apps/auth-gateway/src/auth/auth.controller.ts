import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { JwtTokenBody, AuthTokens, OAuthTokenBody } from '@pokehub/auth/models';
import { AppLogger } from '@pokehub/common/logger';
import { AuthGatewayTCPEndpoints } from '@pokehub/auth/endpoints';
import { IJwtAuthService, JWT_AUTH_SERVICE } from '../common/jwt-auth-service.interface';

@Controller()
export class AuthController {
    constructor( @Inject(JWT_AUTH_SERVICE) private readonly authService: IJwtAuthService, private readonly logger: AppLogger ) {
        this.logger.setContext(AuthController.name);
    }

    @MessagePattern({ cmd: AuthGatewayTCPEndpoints.VALIDATE_ACCESS_TOKEN }, Transport.TCP)
    async validateAccessToken(accessToken: string): Promise<boolean> {
        this.logger.log( 'validateAccessToken: Got request to validate provided access token' );
        return await this.authService.validateAccessToken(accessToken);
    }

    @MessagePattern( { cmd: AuthGatewayTCPEndpoints.VALIDATE_EMAIL_CONFIRMATION_TOKEN }, Transport.TCP )
    async validateEmailConfirmationToken(verificationToken: string): Promise<JwtTokenBody> {
        this.logger.log( 'validateEmailConfirmationToken: Got request to validate provided Email Verification Token' );
        return await this.authService.validateEmailVerificationToken(verificationToken);
    }

    @MessagePattern( { cmd: AuthGatewayTCPEndpoints.VALIDATE_OAUTH_TOKEN }, Transport.TCP )
    async validateOAuthToken(oauthToken: string): Promise<OAuthTokenBody> {
        this.logger.log( 'validateOAuthToken: Got request to validate provided OAuth Token' );
        const jwtTokenBody = await this.authService.validateOAuthToken(oauthToken);
        const tokens = await this.authService.generateAccessAndRefreshTokens(jwtTokenBody);
        return new OAuthTokenBody(jwtTokenBody.username, jwtTokenBody.email, jwtTokenBody.uid, tokens.accessToken, tokens.refreshToken);
    }

    @MessagePattern( { cmd: AuthGatewayTCPEndpoints.VALIDATE_PASSWORD_RESET_TOKEN }, Transport.TCP )
    async validatePasswordResetToken(passwordResetToken: string): Promise<{ email: string }> {
        this.logger.log( 'validatePasswordResetToken: Got request to validate provided Password Reset Token' );
        return await this.authService.validatePasswordResetToken(passwordResetToken);
    }

    @MessagePattern({ cmd: AuthGatewayTCPEndpoints.DECODE_TOKEN }, Transport.TCP)
    async decodeToken(accessToken: string): Promise<JwtTokenBody> {
        this.logger.log('decodeToken: Got request to Decode Access Token');
        return await this.authService.decodeToken(accessToken);
    }

    @MessagePattern({ cmd: AuthGatewayTCPEndpoints.GENERATE_TOKENS }, Transport.TCP)
    async generateTokens(userInfo: JwtTokenBody): Promise<AuthTokens> {
        this.logger.log( `generateTokens: Got request to generate tokens for user with uid ${userInfo.uid}` );
        return await this.authService.generateAccessAndRefreshTokens(userInfo);
    }
   
    @MessagePattern( { cmd: AuthGatewayTCPEndpoints.GET_EMAIL_VERIFICATION_TOKEN }, Transport.TCP )
    async getEmailVerificationToken( userData: JwtTokenBody ): Promise<{ email_verification_token: string }> {
        this.logger.log( 'getEmailVerificationToken: Got request to generate new Email Verification Token' );
        return await this.authService.getNewEmailVerificationToken(userData);
    }

    @MessagePattern( { cmd: AuthGatewayTCPEndpoints.GET_PASSWORD_RESET_TOKEN }, Transport.TCP )
    async getPasswordResetToken( userData: { email: string } ): Promise<{ password_reset_token: string }> {
        this.logger.log( `getPasswordResetToken: Got request to generate new Password Reset Token for ${userData.email}` );
        return await this.authService.getNewPasswordResetToken(userData);
    }
}
