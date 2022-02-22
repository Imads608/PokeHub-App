import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserRequest, UserData, UserDataWithStatus, UserDataWithToken, } from '@pokehub/user/models';
import { IUserData, TypeAccount, TCPEndpoints } from '@pokehub/user/interfaces';
import { EmailLogin, UsernameLogin, JwtTokenBody, AuthTokens, RefreshToken } from '@pokehub/auth/models';
import { ConfigService } from '@nestjs/config';
import { LoginTicket, OAuth2Client, TokenPayload } from 'google-auth-library';
import { IAuthService } from './auth-service.interface';
import { AppLogger } from '@pokehub/common/logger';

@Injectable()
export class AuthService implements IAuthService {
    private client: OAuth2Client;

    constructor(@Inject('UserMicroservice') private readonly clientProxy: ClientProxy, private readonly jwtService: JwtService,
                private configService: ConfigService, private readonly logger: AppLogger) {
        this.client = new OAuth2Client(
        configService.get<string>('googleClientCreds.id'),
        configService.get<string>('googleClientCreds.secret')
        );
        this.logger.setContext(AuthService.name);
    }

    async googleOAuthLogin(tokenId: string): Promise<UserDataWithToken> {
        try {
            this.logger.log(`googleOAuthLogin: Verifying User Google OAuth Token`);
            // Verify Token through Google API
            const userDetails: LoginTicket = await this.client.verifyIdToken({ idToken: tokenId, });
            const payload: TokenPayload = userDetails.getPayload();

            this.logger.log( `googleOAuthLogin: Successfully verified token and retrieved User Public Data` );

            // Create or Retrieve User Data
            this.logger.log( `googleOAuthLogin: Fetching/Creating User Data from User Microservice` );
            const createReq = new CreateUserRequest( payload.email, 'testOAuth', TypeAccount.GOOGLE.toString(), `${payload.email} + ${this.configService.get<string>( 'ACCESS_TOKEN_SECRET' )}`, payload.given_name, payload.family_name );
            const userData = await firstValueFrom( this.clientProxy.send<UserDataWithStatus>( { cmd: TCPEndpoints.GOOGLE_OAUTH_LOGIN }, createReq ) );
            if (!userData)
                throw new RpcException('Unable to retrieve User Data at this time');

            this.logger.log( `googleOAuthLogin: Successfully fetched/created User Data from User Microservice` );

            // Create Access and Refresh Tokens
            const tokens = await this.generateNewTokens( new JwtTokenBody(userData.user.username, (userData.user as UserData).email, userData.user.uid) );

            // Send User Data back
            this.logger.log( `googleOAuthService: Successfully authenticated User through Google OAuth. Sending User Details back...` );
            return new UserDataWithToken( userData.user as UserData, tokens.accessToken, userData.status, tokens.refreshToken );
        } catch (err) {
            this.logger.error( `googleOAuthLogin: Got error while authenticating user through Google OAuth: ${err}` );
            throw err;
        }
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

    async emailLogin(userCreds: EmailLogin): Promise<UserDataWithToken> {
        try {
            // Retrieve User Data from User Service
            this.logger.log( `emailLogin: Retrieving User Data from User Microservice with email ${userCreds.email}` );
            const userData = await firstValueFrom( this.clientProxy.send<UserDataWithStatus>( { cmd: TCPEndpoints.FIND_USER_EMAIL }, userCreds.email ) );
            if (!userData) throw new RpcException('Invalid Credentials');

            this.logger.log( `emailLogin: Successfully retrieved User Data from User Microservice with email: ${userCreds.email}` );

            // Validate User Credentials
            const isValidated: boolean = await this.validateCreds( userData.user as UserData, userCreds.password );
            (userData.user as UserData).password = null;

            // Send back User Data with Access and Refresh Tokens otherwise throw Exception
            if (isValidated) {
                const tokens = await this.generateNewTokens( new JwtTokenBody(userData.user.username, (userData.user as UserData).email, userData.user.uid) );
                return new UserDataWithToken(userData.user as UserData, tokens.accessToken, userData.status, tokens.refreshToken);
            }
            throw new RpcException('Invalid Credentials');
        } catch (err) {
            this.logger.error( `emailLogin: Got exception trying to login user by email ${userCreds.email}: ${err}` );
            if (err.message && err.message.includes('Invalid Credentials')) throw err;
            throw new RpcException('Internal Server Error');
        }
    }

    async usernameLogin(userCreds: UsernameLogin): Promise<UserDataWithToken> {
        try {
            // Retrieve User Data from User Service
            this.logger.log( `usernameLogin: Retrieving User Data from User Microservice with username ${userCreds.username}` );
            const userData = await firstValueFrom( this.clientProxy.send<UserDataWithStatus>( { cmd: TCPEndpoints.FIND_USER_USERNAME }, userCreds.username ) );
            if (!userData) throw new RpcException('Invalid Credentials');

            this.logger.log( `usernameLogin: Successfully retrieved User Data from User Microservice with username: ${userData.user.username}` );

            // Validate User Credentials
            const isValidated: boolean = await this.validateCreds( userData.user as UserData, userCreds.password );
            (userData.user as UserData).password = null;

            // Send back User Data with Access and Refresh Tokens otherwise throw Exception
            if (isValidated) {
                const tokens = await this.generateNewTokens( new JwtTokenBody(userData.user.username, (userData.user as UserData).email, userData.user.uid) );
                return new UserDataWithToken(userData.user as UserData, tokens.accessToken, userData.status, tokens.refreshToken );
            }
            throw new RpcException('Invalid Credentials');
        } catch (err) {
            this.logger.error( `usernameLogin: Got exception trying to login user by username ${userCreds.username}: ${err}` );
            throw new RpcException('Internal Server Error');
        }
    }

    async generateNewTokens(userJwt: JwtTokenBody): Promise<AuthTokens> {
        this.logger.log( `generateNewTokens: Creating Access and Refresh Tokens for user with uid ${userJwt.uid}` );
        
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

        this.logger.log( `generateNewTokens: Successfulyy created Access and Refresh Tokens for user with uid ${userJwt.uid}` );
        return new AuthTokens(accessToken, new RefreshToken(refreshToken, 60*60*24*2));
    }

    private async validateCreds( userFromDB: UserData, passwordUsed: string ): Promise<boolean> {
        this.logger.log( `validateCreds: Validating Credentials for User ${userFromDB.uid}` );

        if (userFromDB) {
            const res = await bcrypt.compare(passwordUsed, userFromDB.password);
            if (res) {
                this.logger.log(`validateCreds: Credentials are valid`);
                return true;
            }
        }

        this.logger.log( `validateCreds: User credentials provided are invalid for user ${userFromDB.uid}` );
        return false;
    }
}
