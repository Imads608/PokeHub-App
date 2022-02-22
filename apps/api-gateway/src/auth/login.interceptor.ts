import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  ForbiddenException,
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
        if ( err.message && (err.message.includes('Invalid Credentials') || err.message.includes('not authorized')) || err.message.includes('401') ) {
          throw new UnauthorizedException(err.message);
        } else if (err instanceof BadRequestException) {
          throw err;
        } else if (err instanceof ForbiddenException) {
          throw err;
        } else if (err instanceof UnauthorizedException)
          throw err;

        throw new InternalServerErrorException( 'An error occurred on the server' );
      })
    );
  }
}
