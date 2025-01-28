'use client';

import { App } from './app';
import {
  SharedAppBootstrapper,
  type Provider,
} from '@pokehub/frontend/shared-app-bootstrapper';
import { AuthContextProvider } from '@pokehub/frontend/shared-auth-context';
import { QueryProvider } from '@pokehub/frontend/shared-query-client-provider';
import { useMemo } from 'react';

export const AppBootstrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const providers: Provider[] = useMemo(
    () => [QueryProvider, AuthContextProvider],
    []
  );
  return (
    <SharedAppBootstrapper providers={providers}>
      <App>{children}</App>
    </SharedAppBootstrapper>
  );
};
