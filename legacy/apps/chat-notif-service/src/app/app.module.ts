import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom, Participant } from '@pokehub/room/database';
import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { PubSubModule } from '../pubsub/pubsub.module';
// Comment for testing
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
      entities: [ChatRoom, Participant],
      synchronize: true,
    }),
  })],
  controllers: [],
  providers: [],
})
export class AppModule {}
