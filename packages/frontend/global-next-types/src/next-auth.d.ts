import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    error?: 'RefreshTokenError';
    user?: UserCore;
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    user: UserCore;
    error?: 'RefreshTokenError';
  }
}
