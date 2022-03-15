import { ConsumeMessage } from "amqplib";

export const ROOM_EVENTS_RECEIVER_SERVICE = 'ROOM_EVENTS_RECEIVER_SERVICE';

export interface IRoomEventsReceiverService {
    /**
     * Message Handler for Public Room Events
     * @param msg The Data containing the Room Event
     * @param amqpMsg General Fields and Properties related to the AMQP message
     */
    publicRoomEventsMessageHandler( msg: any, amqpMsg: ConsumeMessage): Promise<void>;
}