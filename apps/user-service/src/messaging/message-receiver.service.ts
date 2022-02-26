import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { Injectable } from "@nestjs/common";
import { AppLogger } from "@pokehub/common/logger";
import { UserEventMessage, UserStatusEvent } from "@pokehub/event/user";
import { ConsumeMessage } from 'amqplib';

@Injectable()
export class MessageReceiverService {
  constructor(private readonly logger: AppLogger) {
      this.logger.setContext(MessageReceiverService.name);
  }

  @RabbitSubscribe({
    exchange: 'events-exchange',
    queue: '',
    routingKey: 'events.user.status',
  })
  async userStatusEventMessageHandler( msg: UserEventMessage<UserStatusEvent>, amqpMsg: ConsumeMessage ): Promise<void> {
    try {
      this.logger.log(`userStatusEventMessageHandler: Got message to process User Status for uid ${msg.data.status.uid} with timestamp ${amqpMsg.properties.timestamp}`);
    } catch (err) {
      this.logger.error(`userStatusEventMessageHandler: Got error while trying to process User Status Message: ${JSON.stringify(err)}`);
      throw err;
    }
  }
}
