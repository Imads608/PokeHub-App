import { UserJwtData } from './jwt.model';
import type { Request } from 'express';

export interface AuthLoadRequest extends Request {
  user: UserJwtData;
}
