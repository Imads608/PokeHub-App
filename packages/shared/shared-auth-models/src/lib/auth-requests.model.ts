import { z } from 'zod';

export const createGoogleOAuthReqSchema = z.object({
  email: z.string().email(),
  idToken: z.string(),
});

export type GoogleOAuthRequest = z.infer<typeof createGoogleOAuthReqSchema>;

export interface AccessTokenRefreshResponse {
  value: string;
  expirySeconds: number;
}
