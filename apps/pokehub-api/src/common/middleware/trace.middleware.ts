import { Injectable, NestMiddleware } from '@nestjs/common';
import { requestContext } from '@pokehub/shared/shared-request-context';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const traceId = req.headers['x-trace-id'] || randomUUID();
    typeof traceId === 'string' && requestContext.run({ traceId }, next);
  }
}
