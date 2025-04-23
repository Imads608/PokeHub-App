import { AppLogger } from './logger.service';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  controllers: [],
  providers: [AppLogger],
  exports: [AppLogger],
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              utilities.format.nestLike(configService.get<string>('appName'), {
                prettyPrint: true,
                colors: true,
              })
            ),
          }),
        ],
      }),
    }),
  ],
})
export class AppLoggerModule {}
