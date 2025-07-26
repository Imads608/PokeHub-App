import '@pokehub/frontend/global-next-types';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import type {
  AccessToken,
  AccessTokenRefreshResponse,
} from '@pokehub/shared/shared-auth-models';
import type { OAuthLoginResponse } from '@pokehub/shared/shared-user-models';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access token to the token right after signin
      //console.log('Got Data back', token, account, profile);
      // On Initial Sign In
      console.log('JWT Callback called');
      if (account) {
        // Call backend service to get tokens
        try {
          const response = await getFetchClient(
            'API'
          ).fetchApi<OAuthLoginResponse>('/auth/oauth-login', {
            headers: { authorization: `Bearer ${account.id_token}` },
          });

          const dataOrError = await response.json();
          if (!response.ok) {
            console.log('Error getting user and tokens: ', response);
            throw dataOrError;
          }

          const data = dataOrError as OAuthLoginResponse;
          console.log('Data from backend', !!data.user.username);

          return {
            ...token,
            user: data.user,
            accessToken: data.tokens.accessToken.value,
            refreshToken: data.tokens.refreshToken,
            expiresAt:
              Date.now() + data.tokens.accessToken.expirySeconds * 1000,
          };
        } catch (err) {
          console.error('Error getting user and tokens: ', err);
          throw new TypeError('Error getting user and tokens');
        }
      } else if (Date.now() < token.expiresAt) {
        console.log('Token is still valid');
        return token;
      } else {
        console.log('Checking token');
        if (!token.refreshToken) {
          console.error('No Refresh token found');
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
            console.error('Unable to refresh access token: ', response);
            throw dataOrError;
          }
          console.log('Data from access token refresh', dataOrError);

          const data = dataOrError as AccessToken;
          return {
            ...token,
            accessToken: data.value,
            expiresAt: data.expirySeconds,
          };
        } catch (err) {
          console.error('Error refreshing access token', err);
          throw new TypeError('Error refreshing access token');
        }
      }
    },
    async session({ session, token }) {
      // Send properties to the client, like an access token and user id from a provider
      //session.accessToken = token.accessToken;
      //session.idToken = token.idToken;
      console.log('Session:', session, token);
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
