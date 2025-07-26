import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ServiceError,
  type ServiceErrorType,
} from '@pokehub/backend/shared-exceptions';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { Response } from 'express';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter<unknown> {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(CatchEverythingFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ServiceError) {
      this.handleServiceError(exception);
    } else if (exception instanceof HttpException) {
      this.logger.log(`'Got HttpException, returning as it is`);
      response.status(exception.getStatus()).json(exception.getResponse());
    } else {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'An Error Occurred' });
    }
  }

  handleServiceError(error: ServiceError<ServiceErrorType>) {
    this.logger.log(`Service Error: ${error.name}`);
  }
}
