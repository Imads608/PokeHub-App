import {
  AuthContext,
  type SharedAuthContext,
} from '@pokehub/frontend/shared-auth-context';
import { UserCoreAccountRole } from '@pokehub/shared/shared-user-models';
import { useState } from 'react';

export interface AuthContextProviderProps {
  children: React.ReactNode;
  contextValues?: SharedAuthContext<'Read'>;
}

export const AuthContextProvider = ({
  children,
  contextValues,
}: AuthContextProviderProps) => {
  const [values] = useState(() => getValues(contextValues));
  const [isAuthenticated, setIsAuthenticated] = useState(
    values.isAuthenticated.value
  );
  const [isEmailVerified, setIsEmailVerified] = useState(
    values.isEmailVerified.value
  );
  const [loading, setLoading] = useState(values.loading.value);
  const [userAccountRole, setUserAccountRole] = useState<
    UserCoreAccountRole | undefined
  >(values.accountRole.value);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: {
          setValue: setIsAuthenticated,
          value: isAuthenticated,
        },
        isEmailVerified: {
          setValue: setIsEmailVerified,
          value: isEmailVerified,
        },
        loading: { setValue: setLoading, value: loading },
        accountRole: { setValue: setUserAccountRole, value: userAccountRole },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const getValues = (
  contextValues?: SharedAuthContext<'Read'>
): SharedAuthContext<'Read'> => ({
  accountRole: {
    value: contextValues?.accountRole?.value ?? defaultValue.accountRole.value,
  },
  isAuthenticated: {
    value:
      contextValues?.isAuthenticated?.value ??
      defaultValue.isAuthenticated.value,
  },
  isEmailVerified: {
    value:
      contextValues?.isEmailVerified?.value ??
      defaultValue.isEmailVerified.value,
  },
  loading: {
    value: contextValues?.loading?.value ?? defaultValue.loading.value,
  },
});

const defaultValue: SharedAuthContext<'Read'> = {
  accountRole: { value: undefined },
  isAuthenticated: { value: false },
  isEmailVerified: { value: false },
  loading: { value: true },
};

// Set this to display in browser devtools
AuthContextProvider.displayName = 'AuthContextProvider';
