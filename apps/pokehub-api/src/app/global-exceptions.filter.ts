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

    this.logger.error('An unhandled exception occurred', exception);
    if (exception instanceof ServiceError) {
      this.logger.log(`'Got ServiceError, passing to handler'`);
      this.handleServiceError(exception, response);
    } else if (exception instanceof HttpException) {
      this.logger.log(`'Got HttpException, returning as it is`);
      response.status(exception.getStatus()).json(exception.getResponse());
    } else {
      this.logger.log(`'Got unknown exception, returning 500'`);
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'An Error Occurred' });
    }
  }

  handleServiceError(
    error: ServiceError<ServiceErrorType>,
    response: Response
  ) {
    this.logger.log(`Service Error Type: ${error.name}`);

    const errorResponse = { message: error.message };
    let status = HttpStatus.INTERNAL_SERVER_ERROR; // Default to 500

    if (error.name === 'BadRequest') {
      status = HttpStatus.BAD_REQUEST; // 400
    } else if (error.name === 'Unauthorized') {
      status = HttpStatus.UNAUTHORIZED; // 401
    }

    response.status(status).json(errorResponse);
  }
}
