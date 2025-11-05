'use client';

import { App } from './app';
import type { ModdedDex } from '@pkmn/dex';
import { Dex } from '@pkmn/dex';
import {
  SharedAppBootstrapper,
  type Provider,
} from '@pokehub/frontend/shared-app-bootstrapper';
import { AuthContextProvider } from '@pokehub/frontend/shared-auth-provider';
import { createFetchClient } from '@pokehub/frontend/shared-data-provider';
import { QueryProvider } from '@pokehub/frontend/shared-query-client-provider';
import { ThemeProvider } from '@pokehub/frontend/shared-theme-context';
import { useEffect, useMemo } from 'react';

export const AppBootstrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const providers: Provider[] = useMemo(
    () => [QueryProvider, AuthContextProvider, ThemeProvider],
    []
  );

  useEffect(() => {
    createFetchClient('API', process.env.NEXT_PUBLIC_POKEHUB_API_URL);
    (window as unknown as { Dex: ModdedDex }).Dex = Dex;
  }, []);

  return (
    <SharedAppBootstrapper providers={providers}>
      <App>{children}</App>
    </SharedAppBootstrapper>
  );
};
