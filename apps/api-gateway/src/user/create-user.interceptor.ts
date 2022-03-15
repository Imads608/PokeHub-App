import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { AppLogger } from '@pokehub/common/logger';
import { catchError, Observable } from 'rxjs';

@Injectable()
export class CreateUserInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {
    logger.setContext(CreateUserInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        this.logger.error(`intercept: Caught error: ${err}`);
        if (
          err.message &&
          (err.message.includes('exists') || err.message.includes('duplicate'))
        ) {
          throw new BadRequestException(err.message);
        }
        throw new InternalServerErrorException(
          'An error occurred on the server'
        );
      })
    );
  }
}
