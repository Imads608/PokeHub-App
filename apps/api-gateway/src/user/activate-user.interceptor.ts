import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { AppLogger } from '@pokehub/logger';
import { catchError, Observable } from 'rxjs';

@Injectable()
export class ActivateUserInterceptor implements NestInterceptor {

  constructor(private readonly logger: AppLogger) {
    logger.setContext(ActivateUserInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        this.logger.error(`intercept: Caught error: ${JSON.stringify(err)}`);
        if (err.message && (err.message.includes('not authorized'))) {
          throw new UnauthorizedException(err.message);
        } else if (err.message && err.message.includes('not valid')) {
          throw new BadRequestException(err.message);
        }
        throw new InternalServerErrorException(err.message);
      })
    );
  }
}
