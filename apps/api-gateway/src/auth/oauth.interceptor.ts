import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable } from 'rxjs';

@Injectable()
export class OauthInterceptor implements NestInterceptor {
  private readonly logger = new Logger(OauthInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle()
      .pipe(catchError((err) => {
        this.logger.debug('Got err ' + err);
        throw new InternalServerErrorException('An error occurred on the server');
      }))
  }
}
