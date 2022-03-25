import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { Inject, Injectable } from "@nestjs/common";
import { AppLogger } from "@pokehub/common/logger";
import { UserEventMessage, UserStatusEvent } from "@pokehub/event/user";
import { UserStatus } from "@pokehub/user/database";
import { Status } from "@pokehub/user/interfaces";
import { ConsumeMessage } from 'amqplib';
import { IUserStatusService, USER_STATUS_SERVICE } from "../common/user-status-service.interface";

@Injectable()
export class MessageReceiverService {
  constructor(private readonly logger: AppLogger, @Inject(USER_STATUS_SERVICE) private readonly userStatusService: IUserStatusService) {
      this.logger.setContext(MessageReceiverService.name);
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
      this.logger.log(`userStatusEventMessageHandler: Got message to process User Status for id ${msg.data.status.id} with timestamp ${new Date(amqpMsg.properties.timestamp)}`);
      if (msg.data.isHardUpdate)
        await this.userStatusService.updateHardUserStatus(msg.data.status as UserStatus);
      else
        await this.userStatusService.updateUserStatus(msg.data.status as UserStatus);
      
      this.logger.log(`userStatusEventMessageHandler: Successfully updated User Status for id ${msg.data.status.id} with timestamp ${new Date(amqpMsg.properties.timestamp)}`);
    } catch (err) {
      this.logger.error(`userStatusEventMessageHandler: Got error while trying to process User Status Message: ${JSON.stringify(err)}`);
      throw err;
    }
  }
}
