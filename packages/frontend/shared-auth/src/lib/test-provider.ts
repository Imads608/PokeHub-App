import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { getLogger } from '@pokehub/frontend/shared-logger/server';
import { type OAuthLoginResponse } from '@pokehub/shared/shared-user-models';
import Credentials from 'next-auth/providers/credentials';

const logger = getLogger('Authjs:TestProvider');

/**
 * Test-only credentials provider for E2E testing
 *
 * SECURITY: Only enabled when NODE_ENV='test' or E2E_TESTING='true'
 * Used by E2E tests to create authenticated NextAuth sessions without real OAuth flow
 *
 * This provider works similarly to Google OAuth but handles the backend call directly:
 * 1. Calls backend test endpoint to create user and get tokens
 * 2. Returns OAuthLoginResponse with required User fields (id, email, name) and testCreds
 * 3. JWT callback extracts tokens from user.testCreds and creates session
 *
 * This is valid because Credentials providers have full control over what they return,
 * unlike OAuth providers which are constrained by the OAuth protocol.
 *
 * @returns Credentials provider if in test environment, null otherwise
 */
export const getTestCredentialsProvider = () => {
  // Only enable in test environment
  // Check both NODE_ENV and custom E2E_TESTING flag
  // (Next.js dev server forces NODE_ENV to 'development', so we need an alternative)
  const isTestEnv =
    process.env.NODE_ENV === 'test' || process.env.E2E_TESTING === 'true';

  if (!isTestEnv) {
    return null;
  }

  return Credentials({
    id: 'test-credentials',
    name: 'Test Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      username: { label: 'Username', type: 'text' },
    },
    async authorize(credentials) {
      logger.info('Test credentials provider - authorize called');

      if (!credentials?.email || typeof credentials.email !== 'string') {
        logger.error('No email provided');
        return null;
      }

      const response = await getFetchClient('API').fetchApi<OAuthLoginResponse>(
        '/test/auth/create-session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            username: credentials.username || null,
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(
          { status: response.status, body: errorBody },
          'Failed to create test session'
        );
        return null;
      }

      const data = (await response.json()) as OAuthLoginResponse;
      logger.info(
        { email: data.user.email, hasTokens: !!data.tokens },
        'Test session created'
      );

      // Return user object with testCreds containing tokens and user data
      // The User interface has been extended to support the testCreds field
      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.username,
        testCreds: {
          user: data.user,
          tokens: data.tokens,
        },
      };
    },
  });
};
