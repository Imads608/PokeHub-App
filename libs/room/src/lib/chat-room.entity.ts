import {Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { RoomType } from "./room-type.enum";
import { IChatRoom } from "./interfaces/chat-room.interface";

@Entity("room", { schema: 'chat-schema'})
export class ChatRoom implements IChatRoom {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: RoomType,
        default: RoomType.DM
    })
    roomType: RoomType;
}
