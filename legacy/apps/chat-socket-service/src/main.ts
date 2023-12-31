import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppLogger } from '@pokehub/common/logger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app/app.module';
import * as cookieParser from 'cookie-parser';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useLogger(await app.resolve(AppLogger));
  app.use(cookieParser());
  app.enableCors();

  const configService: ConfigService = app.get<ConfigService>(ConfigService);
  logger.log(`Application Name is: ${process.env.APPLICATION_NAME}`);
  await app.listen(+configService.get<number>('appPort'));

  logger.log(`Application started on port ${+configService.get<number>('appPort')}`);
}
bootstrap();
