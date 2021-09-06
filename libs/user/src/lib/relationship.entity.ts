import {Entity, Column, PrimaryColumn } from "typeorm";
import { RelationshipType } from './relationship-type.enum';

@Entity("relationship", { schema: 'user-schema'})
export class Relationship {

    @PrimaryColumn()
    uid: string;

    @PrimaryColumn()
    refUid: string;

    @Column({
        type: 'enum',
        enum: RelationshipType,
        default: RelationshipType.FRIEND_REQUEST
    })
    relType: RelationshipType
}
