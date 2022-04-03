import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Status } from '@pokehub/user/interfaces';
import { User } from './user.entity';

@Entity('user-status', { schema: 'user-schema', database: 'users' })
export class UserStatus {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ONLINE,
  })
  state: Status;

  @Column({ type: 'timestamptz' })
  lastSeen: Date;

  @OneToOne(() => User, user => user.status)
  user: User;
}
