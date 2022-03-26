/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { IsEmail, Length } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, } from 'typeorm';
import { TypeAccount } from '../../../interfaces/src/lib/type-account.enum';
//import { TypeAccount } from '@pokehub/user/interfaces';
import { BucketDetails } from '../../../../common/object-store/models/src/lib/bucket-details.model';
//import { BucketDetails } from '@pokehub/common/object-store/models';
import { UserStatus } from '..';

@Entity('user', { schema: 'user-schema', database: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column({ unique: true, nullable: false })
  @Length(7, 20)
  username: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: false })
  @Length(6)
  password: string;

  @Column({ unique: true })
  @IsEmail()
  email!: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: 0 })
  countUsernameChanged: number;

  @Column({ nullable: true, type: 'simple-json' })
  avatar: BucketDetails;

  @Column({ type: 'enum', enum: TypeAccount, default: TypeAccount.REGULAR })
  account: TypeAccount;

  @OneToOne(() => UserStatus)
  @JoinColumn()
  status: UserStatus
}
