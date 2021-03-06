import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm';
import { Status } from '@pokehub/user/interfaces';
import { User } from './user.entity';

@Entity('user-status', { schema: 'user-schema' })
export class UserStatus {
  @PrimaryColumn()
  @OneToOne(() => User, (user) => user.uid, { primary: true })
  uid: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ONLINE,
  })
  status: Status;

  @Column({ type: 'timestamptz' })
  lastSeen: Date;
}
