export interface Tokens {
  accessToken: AccessToken;
  refreshToken: string;
}

export interface AccessToken {
  value: string;
  expirySeconds: number;
}
