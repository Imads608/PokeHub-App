import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, ManyToOne, } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { IParticipant } from '@pokehub/room/interfaces';
import { RoomType } from '@pokehub/room/interfaces';

@Entity('participant', { schema: 'chat-schema' })
export class Participant implements IParticipant {
  @ManyToOne(() => ChatRoom, (room) => room.id, { primary: true })
  room: string;

  @PrimaryColumn({ nullable: false })
  uid: string;

  @Column()
  isActive: boolean;
}
