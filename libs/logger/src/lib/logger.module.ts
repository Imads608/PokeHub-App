import { Module } from '@nestjs/common';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppLogger } from './logger.service';

@Module({
  controllers: [],
  providers: [AppLogger],
  exports: [AppLogger],
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transports: [ new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike(configService.get<string>('appName'), { prettyPrint: true }),
          ),
        }),]
      })
    })
  ]
})
export class LoggerModule {}
