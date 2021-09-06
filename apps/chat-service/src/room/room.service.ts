import { Injectable, Logger } from '@nestjs/common';
import { ChatRoom, Participant, RoomType } from '@pokehub/room'
import { InjectRepository } from '@nestjs/typeorm';
import { createQueryBuilder, InsertResult, Repository } from 'typeorm';
import { UserData } from '@pokehub/user';

@Injectable()
export class RoomService {
    private readonly logger = new Logger(RoomService.name);

    constructor(@InjectRepository(ChatRoom) private chatRoomRepository: Repository<ChatRoom>,
                @InjectRepository(Participant) private participantRepository: Repository<Participant>) {}
    
    async getAllPublicRooms(): Promise<ChatRoom[]> {
        this.logger.log('Getting all Chat Rooms');

        try {
            const rooms: ChatRoom[] = await this.chatRoomRepository.find();
            return rooms;
        } catch (err) {
            this.logger.error(`Got error trying to fetch all Public Rooms: ${err}`);
            throw err;
        }
    }

    async getPublicRoomById(roomId: string) {
        this.logger.log('Fetching Chatroom Data with Id: ' + roomId);
        try {
            const room: ChatRoom = await this.chatRoomRepository.findOne(roomId);
            return room;
        } catch (err) {
            this.logger.error(`Got error fetching chat room with id ${roomId}: ${err}`);
            throw err;
        }
    }

    async getUserJoinedRooms(userId: string): Promise<ChatRoom[]> {
        this.logger.log(`Getting all chat rooms user ${userId} has joined`);
        try {
            /*const rooms = await this.participantRepository.createQueryBuilder("participant")
                .leftJoinAndSelect("participant.roomId", "room", "room.id = participant.roomId")
                .where("participant.uid = :uid", { uid: userId })
                .andWhere("room.roomType = :roomType", { roomType: RoomType.CHAT_ROOM })
                .getMany();*/
            const rooms: ChatRoom[] = await this.chatRoomRepository.createQueryBuilder("room")
                .innerJoinAndSelect(Participant, 'participant', 'participant.roomId = room.id')
                .where(`participant.uid = '${userId}'`)
                .getMany();
            this.logger.log('Result: ' + JSON.stringify(rooms));
            return rooms;

        } catch (err) {
            this.logger.error(`Got error trying to fetch all Public Rooms: ${err}`)
        }
    }
    
    async addNewParticipant(userId: string, roomId: string): Promise<Participant> {
        this.logger.log(`Adding User ${userId} to Participant List for ${roomId}`);
        try {
            const newParticipant = this.participantRepository.create();
            newParticipant.room = roomId;
            newParticipant.uid = userId;

            const res: InsertResult = await this.participantRepository.insert(newParticipant)
            return newParticipant;
        } catch (err) {
            this.logger.error(`Got error trying to add new participant to room ${roomId}: ${err}`);
            throw err;
        }
    }

    async getChatRoomParticipants(roomId: string): Promise<Participant[]> {
        this.logger.log(`Getting all participants of Chat Room ${roomId}`);
        try {
            const participants: Participant[] = await this.participantRepository.createQueryBuilder("room")
                .where("roomId = :roomId", { roomId }).getMany();
            return participants;
        } catch (err) {
            this.logger.error(`Got error getting all participants of Chat Room ${roomId}: ${err}`);
            throw err;
        }
    }
    
}
