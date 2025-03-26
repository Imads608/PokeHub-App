export type ServiceErrorType = BaseServiceErrorType | AuthServiceErrorType;

export type BaseServiceErrorType = 'ServiceError' | 'BadRequest';
export type AuthServiceErrorType = 'Unauthorized';
