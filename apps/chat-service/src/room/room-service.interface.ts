import { ChatRoom, Participant } from '@pokehub/room/database';

export const ROOM_SERVICE = 'ROOM SERVICE';

export interface IRoomService {
  /**
   * Retrieves all the Public Chatrooms available from the Table
   * @returns A List of ChatRoom objects representing the Public Rooms available
   */
  getAllPublicRooms(): Promise<ChatRoom[]>;

  /**
   * Retrieves the data related to a Public Chatroom given its id
   * @param roomId The id associated with the Public Chatroom
   * @returns The ChatRoom object representing the data for the given Id
   */
  getPublicRoomById(roomId: string): Promise<ChatRoom>;

  /**
   * Retrieves a list of Public Chatrooms that the user has joined
   * @param userId The id associated with the user
   * @returns A List of ChatRoom objects representing the Public Rooms that the user has joined.
   */
  getUserJoinedRooms(userId: string): Promise<ChatRoom[]>;

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
