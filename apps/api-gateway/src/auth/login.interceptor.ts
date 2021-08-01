import { CallHandler, ExecutionContext, Injectable, InternalServerErrorException, Logger, NestInterceptor, UnauthorizedException } from '@nestjs/common';
import { catchError } from 'rxjs';

@Injectable()
export class LoginInterceptor implements NestInterceptor {

  private readonly logger = new Logger(LoginInterceptor.name);

  constructor() {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    return next.handle()
      .pipe(catchError((err) => {
        if (err.message && (err.message.includes('invalid credentials'))) {
          throw new UnauthorizedException(err.message);
        }
        throw new InternalServerErrorException('An error occurred on the server');
      }))
  }
}
