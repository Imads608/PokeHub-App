import type {
  UserCore,
  OAuthLoginResponse,
} from '@pokehub/shared/shared-user-models';
// Import the JWT type to ensure TypeScript connects our augmentation
import type { JWT as _JWT } from 'next-auth/jwt';

// Module augmentation for next-auth types

declare module 'next-auth' {
  interface Session {
    error?: 'RefreshTokenError';
    user?: UserCore;
    accessToken?: string;
  }

  /**
   * Extend User interface to support test credentials provider
   * Can be either a standard User or a TestUser (for test environment)
   */
  interface User {
    id: string;
    email: string;
    name?: string | null;
    // Test credentials provider fields (only present in test environment)
    testCreds?: {
      user?: UserCore;
      tokens?: OAuthLoginResponse['tokens'];
    };
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
