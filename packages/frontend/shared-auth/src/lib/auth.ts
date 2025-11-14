import '@pokehub/frontend/global-next-types';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { getLogger } from '@pokehub/frontend/shared-logger/server';
import type {
  AccessToken,
  AccessTokenRefreshResponse,
} from '@pokehub/shared/shared-auth-models';
import { type OAuthLoginResponse } from '@pokehub/shared/shared-user-models';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const logger = getLogger('Authjs');

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async jwt({ token, account, profile, trigger, session }) {
      // Persist the OAuth access token to the token right after signin
      //console.log('Got Data back', token, account, profile);
      // On Initial Sign In
      logger.info(`JWT Callback called: ${trigger}`);
      if (trigger === 'update' && session) {
        logger.info('Session is available, updating token with user data');
        return {
          ...token,
          user: session.user,
        };
      } else if (account) {
        // Call backend service to get tokens
        try {
          const response = await getFetchClient(
            'API'
          ).fetchApi<OAuthLoginResponse>('/auth/oauth-login', {
            headers: { authorization: `Bearer ${account.id_token}` },
          });

          const dataOrError = await response.json();
          if (!response.ok) {
            logger.error(
              'Response not ok. Error getting user and tokens: ',
              dataOrError
            );
            throw dataOrError;
          }

          const data = dataOrError as OAuthLoginResponse;
          logger.info('Data from backend', !!data.user.username);

          return {
            ...token,
            user: data.user,
            accessToken: data.tokens.accessToken.value,
            refreshToken: data.tokens.refreshToken,
            expiresAt:
              Date.now() + data.tokens.accessToken.expirySeconds * 1000,
          };
        } catch (err) {
          logger.error(
            `Error getting user and tokens: ${(err as Error).message}`,
            err
          );
          throw new TypeError('Error getting user and tokens');
        }
      } else if (Date.now() < token.expiresAt) {
        logger.info('Token is still valid');
        return token;
      } else {
        logger.info('Checking token');
        if (!token.refreshToken) {
          logger.error('No Refresh token found');
          throw new TypeError('No refresh token found');
        }

        try {
          const response = await getFetchClient(
            'API'
          ).fetchApi<AccessTokenRefreshResponse>('/auth/access-token', {
            headers: { authorization: `Bearer ${token.refreshToken}` },
          });

          const dataOrError = await response.json();
          if (!response.ok) {
            logger.error('Unable to refresh access token: ', response);
            throw dataOrError;
          }
          logger.info('Data from access token refresh', dataOrError);

          const data = dataOrError as AccessToken;
          return {
            ...token,
            accessToken: data.value,
            expiresAt: data.expirySeconds,
          };
        } catch (err) {
          logger.error('Error refreshing access token', err);
          throw new TypeError('Error refreshing access token');
        }
      }
    },
    async session({ session, token }) {
      // Send properties to the client, like an access token and user id from a provider
      //session.accessToken = token.accessToken;
      //session.idToken = token.idToken;
      logger.info('Session:', session, token);
      session.error = token.error;
      if (token.user) {
        session.user = { ...token.user, emailVerified: new Date() };
        session.accessToken = token.accessToken;
      }
      return session;
    },
    // authorized: ({ auth, request }) => {
    //   console.log('Authorized callback called', auth, request.nextUrl.pathname);
    //   return true;
    // },
  },
});
