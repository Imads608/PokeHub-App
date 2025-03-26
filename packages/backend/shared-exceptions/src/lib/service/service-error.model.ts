import type { ServiceErrorType } from './service-error.type';

export class ServiceError<T extends ServiceErrorType> extends Error {
  public override name: T;
  public InnerError?: Error;

  constructor(name: T, message: string, innerError?: Error) {
    super(message);
    this.name = name;
    this.InnerError = innerError;
  }
}
