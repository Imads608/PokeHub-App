import { IsEmail, Length } from "class-validator";
import {Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, Unique} from "typeorm";
import { TypeAccount } from './type-account.enum';

@Entity("user", { schema: 'user-schema'})
export class User {

    @PrimaryGeneratedColumn("uuid")
    uid: string;

    @Column({ unique: true, nullable: false })
    @Length(7, 20)
    username: string;

    @Column({ nullable: true })
    firstName: string;

    @Column({ nullable: true })
    lastName?: string;

    @Column({ nullable: true })
    @Length(6)
    password?: string;

    @Column({ unique: true })
    @IsEmail()
    email: string;

    @Column({
        type: 'enum',
        enum: TypeAccount,
        default: TypeAccount.REGULAR
    })
    account: TypeAccount;


}
