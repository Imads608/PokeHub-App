import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transport, ClientsModule } from '@nestjs/microservices';
import { LoggerModule } from '@pokehub/common/logger';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: '60s' },
      }),
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
            port: +configService.get<number>('USER_MICROSERVICE_PORT'),
          },
        }),
      },
    ]),
    LoggerModule,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
