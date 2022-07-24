import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { Inject, Injectable } from "@nestjs/common";
import { AppLogger } from "@pokehub/common/logger";
import { UserEventMessage, UserStatusEvent } from "@pokehub/event/user";
import { ConsumeMessage } from 'amqplib';
import { IStatusEventsPublisherService, STATUS_EVENTS_PUBLISHER_SERVICE } from "./status-events-publisher-service.interface";
import { IStatusMessageReceiverService } from "./status-message-receiver-service.interface";

@Injectable()
export class StatusMessageReceiverService implements IStatusMessageReceiverService {
  constructor(private readonly logger: AppLogger, 
    @Inject(STATUS_EVENTS_PUBLISHER_SERVICE) private readonly statusPublisher: IStatusEventsPublisherService) {
      this.logger.setContext(StatusMessageReceiverService.name);
  }

  @RabbitSubscribe({
    exchange: 'events-exchange',
    queue: '',
    routingKey: 'events.user.status',
    queueOptions: {
      autoDelete: true,
      durable: false,
      messageTtl: 10000
    }
  })
  async userStatusEventMessageHandler( msg: UserEventMessage<UserStatusEvent>, amqpMsg: ConsumeMessage ): Promise<void> {
    try {
      this.logger.log(`userStatusEventMessageHandler: Got User Status ${msg.data.status.state} for id ${msg.data.status.id} with timestamp ${new Date(amqpMsg.properties.timestamp)}`);
      await this.statusPublisher.publishUserStatus(msg);
      this.logger.log(`userStatusEventMessageHandler: Successfully published User Status to Notification Service for id ${msg.data.status.id} with timestamp ${new Date(amqpMsg.properties.timestamp)}`);
    } catch (err) {
      this.logger.error(`userStatusEventMessageHandler: Got error while trying to process User Status Message: ${err.message}`, err.stack);
      throw err;
    }
  }
}
