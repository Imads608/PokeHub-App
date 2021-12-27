import { Controller, Get, Logger } from '@nestjs/common';
import { ChatRoom } from '@pokehub/room';

@Controller()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
