import { UserEventMessage, UserStatusEvent } from '@pokehub/event/user';
import { ConsumeMessage } from 'amqplib';


export const MESSAGE_RECEIVER_SERVICE = 'MESSAGE_RECEIVER_SERVICE';

export interface IMessageReceiverService {
    /**
     * Handles Messages related to the User Status
     * @param msg The Message Received from the Message Bus. This contains the User Status Event
     * @param amqpMsg This is the message related to AMQP
     */
    userStatusEventMessageHandler( msg: UserEventMessage<UserStatusEvent>, amqpMsg: ConsumeMessage): void;
}