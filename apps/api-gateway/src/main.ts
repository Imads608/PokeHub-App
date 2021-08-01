import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get<ConfigService>(ConfigService);
  await app.listen(+configService.get<Number>('APPLICATION_PORT'));
  logger.log(`Application started on port ${+configService.get<Number>('APPLICATION_PORT')}`);
}
bootstrap();
