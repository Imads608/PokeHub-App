import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule, Routes } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { DirectMessageModule } from '../chat/dm/direct-message.module';
import { RoomModule } from '../chat/room/room.module';
import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { UserModule } from '../user/user.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailModule } from '../mail/mail.module';

const routes: Routes = [
  {
    path: '/auth',
    module: AuthModule,
  },
  {
    path: '/users',
    module: UserModule,
  },
  {
    path: '/mail',
    module: MailModule,
  },
  {
    path: '/chat',
    module: ChatModule,
    children: [
      {
        path: '/public-rooms',
        module: RoomModule,
      },
      {
        path: '/direct-message',
        module: DirectMessageModule,
      },
    ],
  },
];

@Module({
  imports: [
    MailModule,
    UserModule,
    AuthModule,
    CommonModule,
    ChatModule,
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    RouterModule.register(routes),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
