import { Controller, Get, Logger } from '@nestjs/common';
import { ChatRoom } from '@pokehub/room/database';

@Controller()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
