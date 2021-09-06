import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom, Participant } from '@pokehub/room';
import { RoomModule } from '../room/room.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [RoomModule, TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      type: 'postgres',
      host: configService.get('DB_HOST'),
      port: +configService.get<number>('DB_PORT'),
      username: configService.get('DB_USERNAME'),
      password: configService.get('DB_PASSWORD'),
      database: configService.get('DB_DATABASE'),
      entities: [ChatRoom, Participant],
      synchronize: true,
    })
  }), ConfigModule.forRoot({
    isGlobal: true
  })],
  controllers: [],
  providers: [],
})
export class AppModule {}
