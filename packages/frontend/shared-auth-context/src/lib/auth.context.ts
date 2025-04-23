import type { SharedAuthContext } from './auth.context.model';
import { createContext } from 'react';

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
