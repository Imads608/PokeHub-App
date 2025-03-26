export interface Tokens {
  accessToken: string;
  refreshToken: RefreshToken;
}

export interface RefreshToken {
  value: string;
  expirySeconds: number;
}
