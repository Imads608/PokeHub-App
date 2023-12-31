import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { RoomModule } from '../room/room.module';

@Module({
  imports: [RoomModule, CommonModule, ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration],
  })],
})
export class AppModule {}
