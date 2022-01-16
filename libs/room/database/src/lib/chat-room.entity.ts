import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, OneToMany, } from 'typeorm';
import { RoomType } from '@pokehub/room/interfaces';
import { IChatRoom } from '@pokehub/room/interfaces';
import { Participant } from './participant.entity';

@Entity('room', { schema: 'chat-schema' })
export class ChatRoom implements IChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.DM,
  })
  roomType: RoomType;

  @OneToMany(() => Participant, (participant) => participant.uid)
  participants: Participant[];
}
