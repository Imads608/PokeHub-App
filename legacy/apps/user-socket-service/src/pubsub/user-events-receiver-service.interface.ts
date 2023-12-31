import { UserEventMessage } from "@pokehub/event/user";
import { ConsumeMessage } from "amqplib";

export const USER_EVENTS_RECEIVER_SERVICE = 'USER_EVENTS_RECEIVER_SERVICE';

export interface IUserEventsReceiverService {
    /**
     * User Events Message Handler
     * @param msg The User Event Data
     * @param amqpMsg General data and fields that AMQP Provides for a message
     */
    userEventsMessageHandler( msg: UserEventMessage<any>, amqpMsg: ConsumeMessage )
}