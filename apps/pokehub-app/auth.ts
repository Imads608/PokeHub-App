import type { OAuthLoginResponse } from '@pokehub/shared/shared-user-models';
import NextAuth from 'next-auth';
import 'next-auth/jwt';
import Google from 'next-auth/providers/google';

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  //providers: [Google],
  //callbacks

  providers: [Google],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access token to the token right after signin
      console.log('Got Data back', token, account, profile);

      // On Initial Sign In
      if (account) {
        // Call backend service to get tokens
        const response = await fetch(
          'http://localhost:3000/api/auth/oauth-login',
          {
            headers: { authorization: `Bearer ${account.id_token}` },
          }
        );
        const data: OAuthLoginResponse = await response.json();
        return {
          ...token,
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken.value,
          expiresAt: data.tokens.refreshToken.expirySeconds,
        };
      } else if (Date.now() < token.expiresAt * 1000) {
        return token;
      } else {
        if (!token.refreshToken) {
          throw new TypeError('No refresh token found');
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access token and user id from a provider
      //session.accessToken = token.accessToken;
      //session.idToken = token.idToken;
      console.log('Session:', session, token);
      return session;
    },
  },
});
