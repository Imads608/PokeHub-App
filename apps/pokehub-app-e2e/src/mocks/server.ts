import { handlers } from './handlers';
import { setupServer } from 'msw/node';

/**
 * MSW server for Node.js environment (Playwright tests)
 * This intercepts HTTP requests at the network level, working for:
 * - Browser requests (client-side)
 * - Next.js Server Component requests (server-side)
 */
export const server = setupServer(...handlers);
