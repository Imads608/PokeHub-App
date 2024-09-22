'use client';

import { SharedAppBootstrapper } from '@pokehub/frontend/shared-app-bootstrapper';
import { AuthContextProvider } from '@pokehub/frontend/shared-auth-context';

export const AppBootstrapper = ({ children }: { children: React.ReactNode }) => {
  return <SharedAppBootstrapper providers={[AuthContextProvider]}>{children}</SharedAppBootstrapper>;
};
