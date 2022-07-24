import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { AppLogger } from '@pokehub/common/logger';
import { catchError, Observable } from 'rxjs';

@Injectable()
export class OauthInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {
    logger.setContext(OauthInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        this.logger.error(`intercept: Caught Error in Interceptor: ${err.message}`, err.stack);
        throw new InternalServerErrorException(
          'An error occurred on the server'
        );
      })
    );
  }
}
