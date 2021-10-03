import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
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
                    port: +configService.get<Number>('authService.port')
                }
            })

        }
    ])],
    providers: [AuthService, AuthGuard],
    exports: [AuthService, AuthGuard]
})
export class CommonModule {}
