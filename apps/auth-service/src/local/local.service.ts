import { Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { EmailLogin, JwtTokenBody, UsernameLogin } from '@pokehub/auth/models';
import { AppLogger } from '@pokehub/common/logger';
import { IUserData, TCPEndpoints } from '@pokehub/user/interfaces';
import { UserData, UserDataWithStatus, UserDataWithToken } from '@pokehub/user/models';
import { firstValueFrom } from 'rxjs';
import { IJwtAuthService, JWT_AUTH_SERVICE } from '../common/jwt-auth-service.interface';
import * as bcrypt from 'bcrypt';
import { ILocalService } from './local-service.interface';

@Injectable()
export class LocalService implements ILocalService {
    constructor(@Inject('UserMicroservice') private readonly clientProxy: ClientProxy, @Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService,
                private readonly logger: AppLogger) {
        this.logger.setContext(LocalService.name);
    }

    async emailLogin(userCreds: EmailLogin): Promise<UserDataWithToken> {
        try {
            // Retrieve User Data from User Service
            this.logger.log( `emailLogin: Retrieving User Data from User Microservice with email ${userCreds.email}` );
            const userData = await firstValueFrom( this.clientProxy.send<UserDataWithStatus>( { cmd: TCPEndpoints.LOAD_USER_WITH_STATUS_BY_EMAIL }, userCreds.email ) );
            if (!userData) throw new UnauthorizedException('Invalid Credentials');

            this.logger.log( `emailLogin: Successfully retrieved User Data from User Microservice with email: ${userCreds.email}` );

            // Validate User Credentials
            const isValidated: boolean = await this.validateCreds(userData.user as UserData, userCreds.password );
            (userData.user as UserData).password = null;

            // Send back User Data with Access and Refresh Tokens otherwise throw Exception
            if (isValidated) {
                const tokens = await this.jwtService.generateAccessAndRefreshTokens(new JwtTokenBody(userData.user.username, (userData.user as UserData).email, userData.user.uid));
                return new UserDataWithToken( userData.user as UserData, tokens.accessToken, userData.status, tokens.refreshToken);
            }
            throw new UnauthorizedException('Invalid Credentials');
        } catch (err) {
            this.logger.error( `emailLogin: Got exception trying to login user by email ${userCreds.email}: ${err}` );
            if (err instanceof UnauthorizedException)
                throw err;
            throw new InternalServerErrorException();
        }
    }

    async usernameLogin(userCreds: UsernameLogin): Promise<UserDataWithToken> {
        try {
            // Retrieve User Data from User Service
            this.logger.log( `usernameLogin: Retrieving User Data from User Microservice with username ${userCreds.username}` );
            const userData = await firstValueFrom( this.clientProxy.send<UserDataWithStatus>( { cmd: TCPEndpoints.LOAD_USER_WITH_STATUS_BY_USERNAME }, userCreds.username ) );
            if (!userData) throw new UnauthorizedException('Invalid Credentials');

            this.logger.log( `usernameLogin: Successfully retrieved User Data from User Microservice with username: ${userCreds.username}` );

            // Validate User Credentials
            const isValidated: boolean = await this.validateCreds(userData.user as UserData, userCreds.password );
            (userData.user as UserData).password = null;

            // Send back User Data with Access and Refresh Tokens otherwise throw Exception
            if (isValidated) {
                const tokens = await this.jwtService.generateAccessAndRefreshTokens(new JwtTokenBody(userData.user.username, (userData.user as UserData).email, userData.user.uid));
                return new UserDataWithToken( userData.user as UserData, tokens.accessToken, userData.status, tokens.refreshToken );
            }
            throw new UnauthorizedException('Invalid Credentials');
        } catch (err) {
            this.logger.error( `usernameLogin: Got exception trying to login user by username ${userCreds.username}: ${err}` );
            if (err instanceof UnauthorizedException)
                throw err;
            throw new InternalServerErrorException();
        }
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
