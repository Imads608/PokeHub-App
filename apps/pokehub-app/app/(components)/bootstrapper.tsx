'use client';

import { App } from './app';
import { Dex } from '@pkmn/dex';
import {
  SharedAppBootstrapper,
  type Provider,
} from '@pokehub/frontend/shared-app-bootstrapper';
import { AuthContextProvider } from '@pokehub/frontend/shared-auth-provider';
import { createFetchClient } from '@pokehub/frontend/shared-data-provider';
import { QueryProvider } from '@pokehub/frontend/shared-query-client-provider';
import { ThemeProvider } from '@pokehub/frontend/shared-theme-context';
import { Session } from 'next-auth';
import { useEffect, useMemo } from 'react';

export const AppBootstrapper = ({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) => {
  const providers: Provider[] = useMemo(
    () => [QueryProvider, AuthContextProvider, ThemeProvider],
    []
  );

  useEffect(() => {
    createFetchClient('API', process.env.NEXT_PUBLIC_POKEHUB_API_URL);
    window.Dex = Dex;
  }, []);

  return (
    <SharedAppBootstrapper session={session} providers={providers}>
      <App>{children}</App>
    </SharedAppBootstrapper>
  );
};
