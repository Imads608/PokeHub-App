import { Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { EmailLogin, JwtTokenBody, UsernameLogin } from '@pokehub/auth/models';
import { AppLogger } from '@pokehub/common/logger';
import { UserData, UserDataWithToken } from '@pokehub/user/models';
import { firstValueFrom } from 'rxjs';
import { IJwtAuthService, JWT_AUTH_SERVICE } from '../common/jwt-auth-service.interface';
import * as bcrypt from 'bcrypt';
import { ILocalService } from './local-service.interface';
import { UserTCPGatewayEndpoints } from '@pokehub/user/endpoints';

@Injectable()
export class LocalService implements ILocalService {
    constructor(@Inject('UserTCPGateway') private readonly clientProxy: ClientProxy, @Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService,
                private readonly logger: AppLogger) {
        this.logger.setContext(LocalService.name);
    }

    async emailLogin(userCreds: EmailLogin): Promise<UserDataWithToken> {
        try {
            // Retrieve User Data from User Service
            this.logger.log( `emailLogin: Retrieving User Data from User Microservice with email ${userCreds.email}`);
            const userData = await firstValueFrom( this.clientProxy.send<UserData>( { cmd: UserTCPGatewayEndpoints.FIND_USER_EMAIL }, userCreds.email ) );
            if (!userData) throw new UnauthorizedException('Invalid Credentials');

            this.logger.log( `emailLogin: Successfully retrieved User Data from User Microservice with email: ${userCreds.email}` );

            // Validate User Credentials
            const isValidated: boolean = await this.validateCreds(userData, userCreds.password );
            userData.password = null;

            // Send back User Data with Access and Refresh Tokens otherwise throw Exception
            if (isValidated) {
                const tokens = await this.jwtService.generateAccessAndRefreshTokens(new JwtTokenBody(userData.username, userData.email, userData.uid));
                return new UserDataWithToken( userData, tokens.accessToken, tokens.refreshToken);
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
            const userData = await firstValueFrom( this.clientProxy.send<UserData>( { cmd: UserTCPGatewayEndpoints.FIND_USER_USERNAME }, userCreds.username ) );
            if (!userData) throw new UnauthorizedException('Invalid Credentials');

            this.logger.log( `usernameLogin: Successfully retrieved User Data from User Microservice with username: ${userCreds.username}` );

            // Validate User Credentials
            const isValidated: boolean = await this.validateCreds(userData, userCreds.password );
            userData.password = null;

            // Send back User Data with Access and Refresh Tokens otherwise throw Exception
            if (isValidated) {
                const tokens = await this.jwtService.generateAccessAndRefreshTokens(new JwtTokenBody(userData.username, userData.email, userData.uid));
                return new UserDataWithToken( userData, tokens.accessToken, tokens.refreshToken );
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
