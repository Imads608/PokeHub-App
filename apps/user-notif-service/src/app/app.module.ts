import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserStatus } from '@pokehub/user/database';
import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { PubSubModule } from '../pubsub/pubsub.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration],
  }), CommonModule, PubSubModule, TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      type: 'postgres',
      host: configService.get('postgresCreds.host'),
      port: +configService.get<number>('postgresCreds.port'),
      username: configService.get('postgresCreds.username'),
      password: configService.get('postgresCreds.password'),
      database: configService.get('postgresCreds.database'),
      entities: [User, UserStatus],
      synchronize: configService.get<boolean>('postgresCreds.sync'),
    }),
  }),],
  controllers: [],
  providers: [],
})
export class AppModule {}
