import { DirectMessageService } from './../common/direct-message.service';
import { DirectMessageController } from './direct-message.controller';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ChatCommonModule } from '../common/chat-common.module';

@Module({
  imports: [ChatCommonModule],
  controllers: [DirectMessageController],
  providers: [],
})
export class DirectMessageModule {}
