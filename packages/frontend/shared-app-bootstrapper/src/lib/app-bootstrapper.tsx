'use client';

import buildProviderTree, { type Provider } from './utils/bootstrap';
import { SessionProvider } from 'next-auth/react';
import { useMemo } from 'react';

export const SharedAppBootstrapper = ({
  children,
  providers,
}: {
  children: React.ReactNode;
  providers: Provider[];
}) => {
  const Providers = useMemo(() => buildProviderTree(providers), [providers]);

  return (
    <SessionProvider>
      <Providers>{children}</Providers>
    </SessionProvider>
  );
};
