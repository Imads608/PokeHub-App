import { UserEventMessage, UserStatusEvent } from "@pokehub/event/user";

export const USER_EVENTS_PUBLISHER_SERVICE = 'USER_EVENTS_PUBLISHER_SERVICE';

export interface IUserEventsPublisherService {
    /**
     * Publishes a Message to User Events Exchange related to the User Status
     * @param message The Data containing the User Status Event
     */
    publishUserStatus(message: UserEventMessage<UserStatusEvent>): Promise<void>
}