import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { AppLogger } from '@pokehub/common/logger';
import { catchError } from 'rxjs';

@Injectable()
export class LoginInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {
    logger.setContext(LoginInterceptor.name);
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    return next.handle().pipe(
      catchError((err) => {
        this.logger.error(`intercept: Error caught in Interceptor: ${err}`);
        if (
          err.message &&
          (err.message.includes('Invalid Credentials') ||
            err.message.includes('not authorized'))
        ) {
          throw new UnauthorizedException(err.message);
        } else if (err instanceof BadRequestException) {
          throw err;
        }
        throw new InternalServerErrorException(
          'An error occurred on the server'
        );
      })
    );
  }
}
