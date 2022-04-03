import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '../common/common.module';
import { ROOM_SERVICE } from './room-service.interface';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';

@Module({
  imports: [CommonModule, ClientsModule.registerAsync([
    {
      name: 'ChatService',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        name: 'ChatService',
        transport: Transport.TCP,
        options: {
          host: configService.get<string>('chatService.host'),
          port: +configService.get<number>('chatService.port'),
        },
      }),
    }])],
  controllers: [RoomController],
  providers: [ { useClass: RoomService, provide: ROOM_SERVICE } ]
})
export class RoomModule {}
