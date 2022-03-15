import { IsEmail, Length } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, } from 'typeorm';
import { IUser } from '@pokehub/user/interfaces';
import { TypeAccount } from '@pokehub/user/interfaces';
import { BucketDetails } from '@pokehub/common/object-store/models';

@Entity('user', { schema: 'user-schema' })
export class User implements IUser {
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
}
