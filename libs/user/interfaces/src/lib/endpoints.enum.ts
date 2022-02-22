export enum TCPEndpoints {
  CREATE_USER = 'create-user',
  GOOGLE_OAUTH_LOGIN = 'google-oauth-login',
  GET_PUBLIC_USER = 'get-public-user',
  LOAD_USER_WITH_STATUS = 'load-user-with-status',
  LOAD_USER_WITH_STATUS_BY_EMAIL = 'load-user-with-status-by-email',
  LOAD_USER_WITH_STATUS_BY_USERNAME = 'load-user-with-status-by-username',
  FIND_USER = 'find-user',
  FIND_USER_EMAIL = 'find-user-email',
  FIND_USER_USERNAME = 'find-user-username',
  GET_USER_STATUS = 'get-user-status',
  VERIFY_USER_EMAIL = 'verify-user-email',
  RESET_PASSWORD = 'reset-password',
  CHECK_EMAIL_EXISTS = 'check-email-exists',
  CHECK_USER_EXISTS = 'check-user-exists',
  UPDATE_USER_DATA = 'update-user-data'
}
