import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transport, ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
          secret: configService.get('ACCESS_TOKEN_SECRET'),
          signOptions: {expiresIn: '60s'}
      })
    }),
    ClientsModule.registerAsync([
        {
            name: 'UserMicroservice',
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                name: 'UserMicroservice',
                transport: Transport.TCP,
                options: {
                    host: 'localhost',
                    port: +configService.get<number>('USER_MICROSERVICE_PORT')
                }
            })

        }
    ])
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
