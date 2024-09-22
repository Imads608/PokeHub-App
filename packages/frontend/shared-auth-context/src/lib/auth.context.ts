import { createContext } from 'react';

import { SharedAuthContext } from './auth.context.model';

export const AuthContext = createContext<SharedAuthContext<'ReadWrite'>>({
  isAuthenticated: {
    value: false,
    setValue: () => {
      // Function needs to be set
    },
  },
  isEmailVerified: {
    value: false,
    setValue: () => {
      // Function needs to be set
    },
  },
  loading: {
    value: false,
    setValue: () => {
      // Function needs to be set
    },
  },
  accountRole: {
    value: undefined,
    setValue: () => {
      // Function needs to be set
    },
  },
});
