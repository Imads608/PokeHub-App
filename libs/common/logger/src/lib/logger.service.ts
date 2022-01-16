import {
  Inject,
  Injectable,
  Logger,
  LoggerService,
  LogLevel,
  Scope,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context!: string;
  @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger!: Logger;

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, ...optionalParams: any[]) {
    this.logger.log(message, this.context, ...optionalParams);
  }
  error(message: any, ...optionalParams: any[]) {
    this.logger.error(message, this.context, ...optionalParams);
  }
  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(message, this.context, ...optionalParams);
  }
  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(message, this.context, ...optionalParams);
  }
  verbose(message: any, ...optionalParams: any[]) {
    this.logger.verbose(message, this.context, ...optionalParams);
  }
  setLogLevels?(levels: LogLevel[]) {
    if (this.logger.localInstance.setLogLevels)
      this.logger.localInstance.setLogLevels(levels);
  }
}
