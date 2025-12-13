import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  traceId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();
