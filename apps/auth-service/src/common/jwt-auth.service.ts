import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { AuthTokens, JwtTokenBody, RefreshToken } from '@pokehub/auth/models';
import { AppLogger } from '@pokehub/common/logger';
import { IJwtAuthService } from './jwt-auth-service.interface';

@Injectable()
export class JwtAuthService implements IJwtAuthService {
    constructor(private readonly jwtService: JwtService, private configService: ConfigService, private readonly logger: AppLogger) {
            this.logger.setContext(JwtAuthService.name);
    }

    async generateAccessAndRefreshTokens(userJwt: JwtTokenBody): Promise<AuthTokens> {
        this.logger.log( `generateAccessAndRefreshTokens: Creating Access and Refresh Tokens for user with uid ${userJwt.uid}` );
        
        // Create Payload
        const payload = { username: userJwt.username, email: userJwt.email, uid: userJwt.uid, };

        // Create Access Token
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('tokenDetails.accessTokenSecret'),
            expiresIn: `${this.configService.get<string>(
                'tokenDetails.accessTokenExpiration'
            )}s`,
        });

        // Create Refresh Token
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('tokenDetails.refreshTokenSecret'),
            expiresIn: '2 days',
        });

        this.logger.log( `generateAccessAndRefreshTokens: Successfulyy created Access and Refresh Tokens for user with uid ${userJwt.uid}` );
        return new AuthTokens(accessToken, new RefreshToken(refreshToken, 60*60*24*2));
    }

    async validateAccessToken(accessToken: string): Promise<boolean> {
        let res = true;
        try {
            await this.jwtService.verifyAsync(accessToken, { secret: this.configService.get<string>('token.'), });
            this.logger.log( `validateAccessToken: Sucessfully validated Access Token` );
        } catch (err) {
            this.logger.error( `validateAccessToken: Got error while validating Access Token: ${err}` );
            res = false;
        }
        return res;
    }

    async validateEmailVerificationToken(verificationToken: string): Promise<JwtTokenBody> {
        try {
            const user: { username: string; uid: string; email: string } = await this.jwtService.verifyAsync(verificationToken, 
                                                                                    { secret: this.configService.get<string>('tokenDetails.accessTokenSecret')});
            this.logger.log(`validateEmailVerificationToken: Sucessfully validated Email Verification Token`);
            return new JwtTokenBody(user.username, user.email, user.uid);
        } catch (err) {
            this.logger.error(`validateEmailVerificationToken: Got error while validating Email Verification Token: ${err}`);
            if (err.message.includes('expired'))
                throw new RpcException('User is not authorized');
            else if (err.message.includes('malformed'))
                throw new RpcException('Token is not valid');
            throw new RpcException('Internal Server Error');
        }
    }

    async validatePasswordResetToken(passwordResetToken: string): Promise<{ email: string }> {
        try {
            const user: { email: string } = await this.jwtService.verifyAsync(passwordResetToken, 
                                                                                    { secret: this.configService.get<string>('tokenDetails.accessTokenSecret')});
            this.logger.log(`validateEmailVerificationToken: Sucessfully validated Email Verification Token`);
            return user;
        } catch (err) {
            this.logger.error(`validateEmailVerificationToken: Got error while validating Email Verification Token: ${err}`);
            if (err.message.includes('expired'))
                throw new RpcException('User is not authorized');
            else if (err.message.includes('malformed'))
                throw new RpcException('Token is not valid');
            throw new RpcException('Internal Server Error');
        }
    }

    async decodeToken(accessToken: string): Promise<JwtTokenBody> {
        try {
            const jwtBody: JwtTokenBody = await this.jwtService.verifyAsync( accessToken, { secret: this.configService.get<string>('tokenDetails.accessTokenSecret') } );
            this.logger.log( `decodeToken: Successfully decoded User Data from Access Token with uid ${jwtBody.uid}` );
            return jwtBody;
        } catch (err) {
            this.logger.error( `decodeToken: Got error while decoding Access Token: ${err}` );
            throw new RpcException('User is unauthorized');
        }
    }

    async getNewAccessToken( refreshToken: string ): Promise<{ access_token: string }> {
        try {
            // Decode Refresh Token to User Data
            this.logger.log(`getNewAccessToken: Decoding Refresh Token: ${refreshToken}`);
            const user: JwtTokenBody = await this.jwtService.verifyAsync(refreshToken, { secret: this.configService.get<string>('tokenDetails.refreshTokenSecret'), });
            this.logger.log(`getNewAccessToken: Successfully decoded Refresh Token: ${JSON.stringify(user)}`);

            // Create new Access Token from Decoded Data
            const accessToken = this.jwtService.sign( { username: user.username, uid: user.uid, email: user.email }, { secret: this.configService.get<string>('tokenDetails.accessTokenSecret'), expiresIn: `${this.configService.get<string>( 'tokenDetails.accessTokenExpiration' )}s`, } );
            this.logger.log( `getNewAccessToken: Successfully created New Access Token from provided Refresh Token` );

            // Return New Access Token
            return { access_token: accessToken };
        } catch (err) {
            this.logger.error( `getNewAccessToken: Got error creating new Access Token: ${JSON.stringify(err)}` );
            if (err.message.includes('expired'))
                throw new RpcException('User is not authorized');
            throw new RpcException('Internal Server Error');
        }
    }

    async getNewAccessTokenFromPayload(user: JwtTokenBody): Promise<{ access_token: string }> {
        try {
            this.logger.log(`getNewAccessTokenFromPayload: Got request to generate new access token from user payload ${user.uid}`);
            // Create new Access Token from Decoded Data
            const accessToken = this.jwtService.sign( { username: user.username, uid: user.uid, email: user.email }, { secret: this.configService.get<string>('tokenDetails.accessTokenSecret'), expiresIn: `${this.configService.get<string>( 'tokenDetails.accessTokenExpiration' )}s`, } );
            this.logger.log( `getNewAccessTokenFromPayload: Successfully created New Access Token from provided Refresh Token` );

            // Return New Access Token
            return { access_token: accessToken };
        } catch (err) {
            this.logger.error(`getNewAccessTokenFromPayload: Got error while creating new Access Token: ${JSON.stringify(err)}`);
            throw new RpcException('Internal Server Error');
        }
    }

    async getNewEmailVerificationToken(user: JwtTokenBody): Promise<{ email_verification_token: string }> {
        try {

            // Create Email Verification Token
            const token = this.jwtService.sign(user, {
                secret: this.configService.get<string>('tokenDetails.accessTokenSecret'),
                expiresIn: `${this.configService.get<string>('tokenDetails.emailVerificationTokenExpiration')}s`,
            });

            this.logger.log(`getNewEmailVerificationToken: Successfully created Email Verification Token`);

            // Return Email Verification Token
            return { email_verification_token: token };
        } catch (err) {
            this.logger.error(`getNewEmailVerificationToken: Got error getting new access token for user with uid ${user.uid}: ${err}`);
            if (err.message.includes('expired'))
                throw new RpcException('User is not authorized');
            
            throw new RpcException('Internal Server Error');
        }
    }

    async getNewPasswordResetToken(user: { email: string }): Promise<{ password_reset_token: string }> {
        try {

            // Create Password Reset Token
            const token = this.jwtService.sign(user, {
                secret: this.configService.get<string>('tokenDetails.accessTokenSecret'),
                expiresIn: `${this.configService.get<string>('tokenDetails.passwordResetTokenExpiration')}s`,
            });

            this.logger.log(`getNewPasswordResetToken: Successfully created Password Reset Token`);

            // Return Password Reset Token
            return { password_reset_token: token };
        } catch (err) {
            this.logger.error(`getNewPasswordResetToken: Got error getting new access token for user with email ${user.email}: ${JSON.stringify(err)}`);
            if (err.message.includes('expired'))
                throw new RpcException('User is not authorized');
            
            throw new RpcException('Internal Server Error');
        }
    }
}
