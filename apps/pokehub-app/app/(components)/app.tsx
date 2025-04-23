'use client';

import { AppNav } from '@pokehub/frontend/pokehub-nav-components';

export const App = ({
  children,
}: {
  children: React.ReactNode | React.ReactNode[];
}) => {
  return (
    <div>
      <AppNav />
      {children}
    </div>
  );
};
