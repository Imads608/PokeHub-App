import { BadRequestException, CallHandler, ExecutionContext, Injectable, InternalServerErrorException, NestInterceptor, } from '@nestjs/common';
import { AppLogger } from '@pokehub/common/logger';
import { catchError, Observable } from 'rxjs';

@Injectable()
export class TokenValidatorInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {
    logger.setContext(TokenValidatorInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        this.logger.error(`intercept: Error caught in Interceptor: ${err}`);
        if (err.message && (err.message.includes('unauthorized') || err.message.includes('not authorized') || err.message.includes('not valid'))) {
          return new Observable<boolean>((subscriber) => {
            subscriber.next(false);
            subscriber.complete();
          });
        } else if (err instanceof BadRequestException) {
          throw err;
        }
        throw new InternalServerErrorException( 'An error occurred on the server' );
      })
    );
  }
}
