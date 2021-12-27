import {Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { RoomType } from "./room-type.enum";
import { IChatRoom } from "./interfaces/chat-room.interface";
import { Participant } from "..";

@Entity("room", { schema: 'chat-schema'})
export class ChatRoom implements IChatRoom {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    name?: string;

    @Column({ nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: RoomType,
        default: RoomType.DM
    })
    roomType: RoomType;

    @OneToMany(() => Participant, participant => participant.uid)
    participants: Participant[]
}
