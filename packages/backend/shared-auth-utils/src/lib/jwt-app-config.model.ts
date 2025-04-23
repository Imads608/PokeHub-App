import type { TokenType } from '@pokehub/shared/shared-auth-models';

export interface JwtAppConfiguration {
  secrets: Record<TokenType, { value: string; expiryMinutes: number }>;
}
