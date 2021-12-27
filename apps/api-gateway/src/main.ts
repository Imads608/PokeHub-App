import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppLogger } from '@pokehub/logger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app/app.module';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useLogger(await app.resolve(AppLogger));
  app.enableCors();
  
  const configService: ConfigService = app.get<ConfigService>(ConfigService);
  await app.listen(+configService.get<number>('appPort'));

  logger.log(`Application started on port ${+configService.get<number>('appPort')}`);
}
bootstrap();
