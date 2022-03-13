import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppLogger } from '@pokehub/common/logger';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IAuthService } from './auth-service.interface';
import { JwtTokenBody } from '@pokehub/auth/models';
import { firstValueFrom } from 'rxjs';
import { HTTPEndpoints } from '@pokehub/auth/interfaces';

@Injectable()
export class AuthService implements IAuthService {
    private authMicroserviceURL: string;

    constructor(private readonly logger: AppLogger, configService: ConfigService, private readonly httpService: HttpService) {
        this.logger.setContext(AuthService.name);
        this.authMicroserviceURL = `${configService.get<string>('protocol')}://${configService.get<string>('authService.host')}:${configService.get<number>('authService.portHttp')}`;
    }

    async decodeToken(accessToken: string): Promise<JwtTokenBody> {
        this.logger.log( `decodeToken: Sending Access Token Validation Request to Auth Service: ${accessToken}` );

        try {
            const userData = (await firstValueFrom( this.httpService.get<JwtTokenBody>(`${this.authMicroserviceURL}/${HTTPEndpoints.AUTHENTICATE_USER}`, { headers: { authorization: accessToken }}))).data;
            if (!userData) throw new InternalServerErrorException();

            this.logger.log( `decodeToken: Successfully decoded Access Token to User Data` );
            return userData;
        } catch (err) {
            this.logger.error( `decodeToken: Got error while decoding and validating Access Token: ${err}` );
            throw err;
        }    
    }
}
