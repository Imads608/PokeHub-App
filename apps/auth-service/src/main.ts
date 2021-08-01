import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);

  const microservice = app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: +configService.get<Number>('APPLICATION_PORT')
    }
  })

  await app.startAllMicroservices();
  await app.listen(+configService.get<Number>('APPLICATION_PORT'));
  logger.log(`Application started on port ${configService.get('APPLICATION_PORT')}`);
  //await app.listen();
}
bootstrap();
