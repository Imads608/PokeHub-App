import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppLogger } from '@pokehub/logger';
import { AppModule } from './app/app.module';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useLogger(await app.resolve(AppLogger));

  const configService: ConfigService = app.get(ConfigService);

  const microservice = app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      port: +configService.get<number>('appPort'),
    },
  });

  await app.startAllMicroservices();
  //await app.listen(+configService.get<Number>('APPLICATION_PORT'));
  logger.log(`Application started on port ${configService.get('appPort')}`);
  //await app.listen();
}
bootstrap();
