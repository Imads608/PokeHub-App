import { RelationshipType } from './relationship-type.enum';

export interface IRelationship {
  uid: string;
  refUid: string;
  relType: RelationshipType;
}
