'use client';

import buildProviderTree, { Provider } from './utils/bootstrap';
import { useMemo } from 'react';

export const SharedAppBootstrapper = ({
  children,
  providers,
}: {
  children: React.ReactNode;
  providers: Provider[];
}) => {
  const Providers = useMemo(() => buildProviderTree(providers), [providers]);

  return <Providers>{children}</Providers>;
};
