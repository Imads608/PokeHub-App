import { Logger, Inject, Injectable, Scope } from '@nestjs/common';
import type { LoggerService, LogLevel } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context!: string;
  @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger!: Logger;

  setContext(context: string) {
    this.context = context;
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    this.logger.log(message, this.context, ...optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.logger.error(message, this.context, ...optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.logger.warn(message, this.context, ...optionalParams);
  }

  debug?(message: unknown, ...optionalParams: unknown[]) {
    this.logger.debug(message, this.context, ...optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    this.logger.verbose(message, this.context, ...optionalParams);
  }

  setLogLevels?(levels: LogLevel[]) {
    if (this.logger.localInstance.setLogLevels) {
      this.logger.localInstance.setLogLevels(levels);
    }
  }
}
