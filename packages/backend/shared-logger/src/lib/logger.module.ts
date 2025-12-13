import { requestContext } from '@pokehub/shared/shared-request-context';
import { AppLogger } from './logger.service';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const traceFormat = winston.format((info) => {
  const traceId = requestContext.getStore()?.traceId;
  if (traceId) {
    info['traceId'] = traceId;
  }
  return info;
});

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
              traceFormat(),
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
