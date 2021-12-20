import {Entity, Column, PrimaryColumn } from "typeorm";
import { RelationshipType } from './relationship-type.enum';
import { IRelationship } from "./interfaces/relationship.interface";

@Entity("relationship", { schema: 'user-schema'})
export class Relationship implements IRelationship {

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
