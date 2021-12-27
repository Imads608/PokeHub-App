import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoggerModule } from '@pokehub/logger';
import { AUTH_SERVICE, IAuthService } from './auth-service.interface';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
        {
            name: 'AuthMicroservice',
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                name: 'AuthMicroservice',
                transport: Transport.TCP,
                options: {
                    host: configService.get<string>('authService.host'),
                    port: +configService.get<number>('authService.port')
                }
            })

        }
    ]), LoggerModule],
    providers: [{ useClass: AuthService, provide: AUTH_SERVICE }, AuthGuard],
    exports: [{ useClass: AuthService, provide: AUTH_SERVICE }, AuthGuard, LoggerModule]
})
export class CommonModule {}
