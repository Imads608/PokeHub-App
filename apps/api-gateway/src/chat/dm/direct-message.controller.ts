/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Logger } from '@nestjs/common';
import { DirectMessageService } from '../common/direct-message.service';

@Controller()
export class DirectMessageController {
  private readonly logger = new Logger(DirectMessageController.name);

  constructor(private dmService: DirectMessageService) {}
}
