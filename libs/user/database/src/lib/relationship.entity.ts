import { Entity, Column, PrimaryColumn } from 'typeorm';
import { RelationshipType, IRelationship } from '@pokehub/user/interfaces';

@Entity('relationship', { schema: 'user-schema', database: 'users' })
export class Relationship implements IRelationship {
  @PrimaryColumn()
  uid: string;

  @PrimaryColumn()
  refUid: string;

  @Column({
    type: 'enum',
    enum: RelationshipType,
    default: RelationshipType.FRIEND_REQUEST,
  })
  relType: RelationshipType;
}
