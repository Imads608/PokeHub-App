/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '../../common/common.module';
import { DirectMessageService } from './direct-message.service';
import { ROOM_SERVICE } from './room-service.interface';
import { RoomService } from './room.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'ChatTCPGateway',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          name: 'ChatTCPGateway',
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('chatGateways.tcpGateway.host'),
            port: +configService.get<number>('chatGateways.tcpGateway.port'),
          },
        }),
      },
    ]),
    CommonModule,
  ],
  controllers: [],
  providers: [
    { useClass: RoomService, provide: ROOM_SERVICE },
    DirectMessageService,
  ],
  exports: [
    { useClass: RoomService, provide: ROOM_SERVICE },
    DirectMessageService,
  ],
})
export class ChatCommonModule {}
