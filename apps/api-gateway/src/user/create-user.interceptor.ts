import { BadRequestException, CallHandler, ExecutionContext, Injectable, InternalServerErrorException, Logger, NestInterceptor } from '@nestjs/common';
import { catchError, Observable } from 'rxjs';

@Injectable()
export class CreateUserInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CreateUserInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle()
      .pipe(catchError((err) => {
        if (err.message && (err.message.includes('exists') || err.message.includes('duplicate'))) {
          throw new BadRequestException(err.message);
        }
        throw new InternalServerErrorException('An error occurred on the server');
      }))
  }
}
