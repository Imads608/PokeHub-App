import { ConsumeMessage } from "amqplib";

export const DM_EVENTS_RECEIVER_SERVICE = 'DM_EVENTS_RECEIVER_SERVICE';

export interface IDMEventsReceiverService {
    /**
     * Message Handler for Direct Message Events
     * @param msg The Data containing the DM
     * @param amqpMsg General Fields and Properties related to the AMQP message
     */
    dmEventsMessageHandler( msg: any, amqpMsg: ConsumeMessage): Promise<void>;
}