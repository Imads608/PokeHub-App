import { ChatRoom, Participant } from "@pokehub/chat/database";
import { UserData } from "@pokehub/user/models";

export const ROOM_SERVICE = 'ROOM_SERVICE';

export interface IRoomService {
    /**
   * Retrieves a List of all The Public Chat Rooms available
   * @returns A List of Objects representing the Chat Rooms
   */
  getAllPublicRooms(): Promise<ChatRoom[]>;

  /**
   *
   * @param roomId The Id associated with the Public Room
   * @returns An Object representing the data for the ChatRoom
   */
  getPublicRoomFromId(roomId: string): Promise<ChatRoom>;

  /**
   * Retrieves a List of all the Users in a Public Chat Room given its Id
   * @param roomId The Id associated with the Public Room
   * @returns A List of Objects representing the Users of the Chat Room
   */
  getPublicRoomUsers(roomId: string): Promise<UserData[]>;

  /**
   * Retrieves a List of all the Public Chat Rooms a User has joined given its Id
   * @param userId The Id associated with the User
   * @returns A List of Objects representing the Chat Rooms
   */
  getJoinedPublicRoomsForUser(userId: string): Promise<ChatRoom[]>;

  /**
   * Adds a User to the Participant List of a Room
   * @param userId The Id associated with the user
   * @param roomId The Id associated with the room
   * @returns The Participant Object for the user
   */
   addNewParticipant(userId: string, roomId: string): Promise<Participant>;

   /**
    * Retrieves all the Participants of a Chat Room
    * @param roomId The Id associated with the Room
    * @returns A List of Participant Objects for the provided room
    */
   getChatRoomParticipants(roomId: string): Promise<Participant[]>;
}