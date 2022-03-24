export enum TCPEndpoints {
  VALIDATE_ACCESS_TOKEN = 'validate-accessToken',
  VALIDATE_EMAIL_CONFIRMATION_TOKEN = 'validate-email-confirmation-token',
  VALIDATE_PASSWORD_RESET_TOKEN = 'validate-password-reset-token',
  DECODE_TOKEN = 'decode-token',
  GENERATE_TOKENS = 'generate-tokens',
  GET_EMAIL_VERIFICATION_TOKEN = 'get-email-verification-token',
  GET_PASSWORD_RESET_TOKEN = 'get-password-reset-token'
}

export enum HTTPEndpoints {
  EMAIL_LOGIN = 'local/login/email',
  USERNAME_LOGIN = 'local/login/username',
  GOOGLE_OAUTH_LOGIN = 'google-oauth',
  GET_ACCESS_TOKEN = 'access-token',
  AUTHENTICATE_USER = 'auth'
}