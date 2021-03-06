import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppLogger } from '@pokehub/common/logger';

const logger = new Logger();

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
  await app.listen(+configService.get<number>('httpPort'));
  logger.log(`Application started on port ${configService.get('httpPort')}`);
}
bootstrap();
