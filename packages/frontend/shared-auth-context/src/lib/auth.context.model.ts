import type {
  ContextField,
  ContextFieldType,
} from '@pokehub/frontend/shared-context';
import type { UserAccountRole } from '@pokehub/shared/shared-user-models';

export interface SharedAuthContext<T extends ContextFieldType> {
  isAuthenticated: ContextField<boolean, T>;
  isEmailVerified: ContextField<boolean, T>;
  accountRole: ContextField<UserAccountRole | undefined, T>;
  loading: ContextField<boolean, T>;
}
