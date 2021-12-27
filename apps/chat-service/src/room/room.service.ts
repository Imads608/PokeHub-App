import { Injectable } from '@nestjs/common';
import { ChatRoom, Participant } from '@pokehub/room';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '@pokehub/logger';
import { IRoomService } from './room-service.interface';

@Injectable()
export class RoomService implements IRoomService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    private readonly logger: AppLogger
  ) {
    logger.setContext(RoomService.name);
  }

  async getAllPublicRooms(): Promise<ChatRoom[]> {
    this.logger.log(`getAllPublicRooms: Retrieving all Chat Rooms`);
    try {
      const rooms: ChatRoom[] = await this.chatRoomRepository.find();
      if (rooms) {
        this.logger.log(
          `getAllPublicRooms: Successfully retrieved all Chat Rooms`
        );
        return rooms;
      }
      this.logger.log(`getAllPublicRooms: No Rooms found`);
      return null;
    } catch (err) {
      this.logger.error(
        `getAllPublicRooms: Got error trying to fetch all Public Rooms: ${err}`
      );
      throw err;
    }
  }

  async getPublicRoomById(
    roomId: string,
    includeParticipants?: boolean
  ): Promise<ChatRoom> {
    this.logger.log(
      `getPublicRoomById: Retrieving Public Room Data for Room ${roomId} with Participant Flag: ${includeParticipants}`
    );
    try {
      const room: ChatRoom = includeParticipants
        ? await this.chatRoomRepository.findOne(roomId, {
            relations: ['participants'],
          })
        : await this.chatRoomRepository.findOne(roomId);

      if (room) {
        this.logger.log(
          `getPublicRoomById: Successfully retrieved data for Room ${roomId} with Participant Flag ${includeParticipants}`
        );
        return room;
      }
      this.logger.log(
        `getPublicRoomById: No Public Room found with id ${roomId}`
      );
      return null;
    } catch (err) {
      this.logger.error(
        `getPublicRoomById: Got error fetching chat room with id ${roomId}: ${err}`
      );
      throw err;
    }
  }

  async getUserJoinedRooms(userId: string): Promise<ChatRoom[]> {
    this.logger.log(
      `getUserJoinedRooms: Getting all chat rooms user ${userId} has joined`
    );
    try {
      /*const rooms = await this.participantRepository.createQueryBuilder("participant")
                .leftJoinAndSelect("participant.roomId", "room", "room.id = participant.roomId")
                .where("participant.uid = :uid", { uid: userId })
                .andWhere("room.roomType = :roomType", { roomType: RoomType.CHAT_ROOM })
                .getMany();*/
      const rooms: ChatRoom[] = await this.chatRoomRepository
        .createQueryBuilder('room')
        .innerJoinAndSelect(
          Participant,
          'participant',
          'participant.roomId = room.id'
        )
        .where(`participant.uid = '${userId}'`)
        .getMany();
      if (rooms) {
        this.logger.log(
          `Successfully retrieved all chat rooms User ${userId} has joined`
        );
        return rooms;
      }
      this.logger.log(
        `getUserJoinedRooms: No Joined Public Rooms found for user ${userId}`
      );
      return null;
    } catch (err) {
      this.logger.error(
        `getUserJoinedRooms: Got error trying to fetch all joined Rooms for user ${userId}: ${err}`
      );
      throw err;
    }
  }

  async addNewParticipant(
    userId: string,
    roomId: string
  ): Promise<Participant> {
    this.logger.log(
      `addNewParticipant: Adding User ${userId} to Participant List for ${roomId}`
    );
    try {
      // Create new Participant
      const newParticipant = this.participantRepository.create();
      newParticipant.room = roomId;
      newParticipant.uid = userId;

      // Insert created Participant
      await this.participantRepository.insert(newParticipant);

      // Return inserted Participant
      this.logger.log(
        `addNewParticipant: Successfully added user ${userId} to Participant List for ${roomId}`
      );
      return newParticipant;
    } catch (err) {
      this.logger.error(
        `addNewParticipant: Got error trying to add user ${userId} to room ${roomId}: ${err}`
      );
      throw err;
    }
  }

  async getChatRoomParticipants(roomId: string): Promise<Participant[]> {
    this.logger.log(
      `getChatRoomParticipants: Getting all participants of Chat Room ${roomId}`
    );
    try {
      const participants: Participant[] = await this.participantRepository
        .createQueryBuilder('room')
        .where('roomId = :roomId', { roomId })
        .getMany();
      if (participants) {
        this.logger.log(
          `getChatRoomParticipants: Successfully retrieved all participants of Chat Room ${roomId}`
        );
        return participants;
      }
      this.logger.log(
        `getChatRoomParticipants: No Participants found for ChatRoom ${roomId}`
      );
      return null;
    } catch (err) {
      this.logger.error(
        `getChatRoomParticipants: Got error getting all participants of Chat Room ${roomId}: ${err}`
      );
      throw err;
    }
  }
}
