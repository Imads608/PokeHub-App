import {
    BadRequestException,
    CallHandler,
    ExecutionContext,
    Injectable,
    InternalServerErrorException,
    NestInterceptor,
    UnauthorizedException,
  } from '@nestjs/common';
  import { AppLogger } from '@pokehub/common/logger';
  import { catchError, Observable } from 'rxjs';
  
  @Injectable()
  export class ResourceInterceptor implements NestInterceptor {
    constructor(private readonly logger: AppLogger) {
      logger.setContext(ResourceInterceptor.name);
    }
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      this.logger.log(`intercept: In Interceptor`);
      return next.handle().pipe(
        catchError((err) => {
          this.logger.error(`intercept: Caught error: ${err.message}`, err.stack);
          if (!(err instanceof BadRequestException) && !(err instanceof UnauthorizedException)) {
              throw new InternalServerErrorException();
          }
          throw err;
        })
      );
    }
  }
  