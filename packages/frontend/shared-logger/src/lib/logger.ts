
import pino from 'pino';

import { requestContext } from '@pokehub/shared/shared-request-context';

const pinoConfig = {
  level: process.env.LOG_LEVEL || 'info',
  mixin() {
    return { traceId: requestContext.getStore()?.traceId };
  },
};

const rootLogger = pino(pinoConfig);

export const getLogger = (context: string) => {
  return rootLogger.child({ context });
};
