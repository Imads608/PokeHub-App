import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
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
                    host: 'localhost',
                    port: +configService.get<Number>('AUTH_MICROSERVICE_PORT')
                }
            })

        }
    ])],
    providers: [AuthService],
    exports: [AuthService]
})
export class CommonModule {}
