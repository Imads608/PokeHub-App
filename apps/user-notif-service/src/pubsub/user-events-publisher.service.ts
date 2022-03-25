import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserEventMessage, UserEventTopics, UserStatusEvent } from '@pokehub/event/user';
import { AppLogger } from '@pokehub/common/logger';
import { IUserEventsPublisherService } from './user-events-publisher-service.interface';
import { Options } from 'amqplib';

@Injectable()
export class UserEventsPublisherService implements IUserEventsPublisherService {
  constructor(private configService: ConfigService, private amqpConnection: AmqpConnection, private readonly logger: AppLogger) {
    this.logger.setContext(UserEventsPublisherService.name);
  }
  
  async publishUserStatus(message: UserEventMessage<UserStatusEvent>): Promise<void> {
    try {
      this.logger.log(`publishUser: Publishing User Status Event Message`);
      await this.amqpConnection.publish(`${this.configService.get<string>('rabbitMQ.eventsExchange.name')}`, 
        `${this.configService.get<string>( 'rabbitMQ.eventsExchange.userEventsRoutingPattern' )}.${UserEventTopics.USER_STATUS}`, message,
        this.getDefaultOptions());
      this.logger.log(`publishUser: Successfully published User Status Event Message`);
    } catch(err) {
      this.logger.error(`publishUserStatus: Got error while trying to publish User Status Event: ${JSON.stringify(err)}`);
      throw err;
    }
    return;
  }

  private getDefaultOptions(): Options.Publish {
    return {
      deliveryMode: 1,
      timestamp: new Date().getTime(),
      appId: this.configService.get<string>('appName')
    }
  }
}
