'use client';

import buildProviderTree, { type Provider } from './utils/bootstrap';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { useMemo } from 'react';

export const SharedAppBootstrapper = ({
  children,
  providers,
  session,
}: {
  children: React.ReactNode;
  providers: Provider[];
  session: Session | null;
}) => {
  const Providers = useMemo(() => buildProviderTree(providers), [providers]);

  return (
    <SessionProvider session={session}>
      <Providers>{children}</Providers>
    </SessionProvider>
  );
};
