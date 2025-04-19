'use client';

import buildProviderTree, { Provider } from './utils/bootstrap';
import { useMemo } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

export const SharedAppBootstrapper = ({
  children,
  providers,
  session
}: {
  children: React.ReactNode;
  providers: Provider[];
  session: Session | null;
}) => {
  const Providers = useMemo(() => buildProviderTree(providers), [providers]);

  return (<SessionProvider session={session}>
          <Providers>
            {children}
          </Providers>
        </SessionProvider>);
};
