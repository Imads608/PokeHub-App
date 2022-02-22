import { IUserProfileWithToken, IUserProfile } from '@pokehub/user/interfaces';
import { createAction } from '@reduxjs/toolkit';
import { APIError } from '../../types/api';

export const request_start = createAction<void>('common/request_start');
export const request_failure = createAction<any>('common/request_failure');
export const auth_failure = createAction<APIError>('common/auth_failure');
export const reset_app_error = createAction<void>('common/reset_app_error');
export const login_success = createAction<IUserProfileWithToken | IUserProfile>('common/login_success');
export const login_success_verification_needed = createAction<IUserProfileWithToken | IUserProfile>('common/login_success_verification_needed');
export const logout = createAction<void>('common/logout');
