import {Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { ChatRoom } from "./chat-room.entity";
import { RoomType } from "./room-type.enum";

@Entity("participant", { schema: 'chat-schema'})
export class Participant {

    @ManyToOne(() => ChatRoom, room => room.id, { primary: true })
    room: string;

    @PrimaryColumn({ nullable: false })
    uid: string;

    @Column()
    isActive: boolean;
}
