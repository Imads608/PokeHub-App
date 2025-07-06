'use client';

import { PokeHubRouter } from '../../router';
import { AppNav } from '@pokehub/frontend/pokehub-nav-components';
import { ClientRouteGuard } from '@pokehub/frontend/shared-app-router';

export const App = ({
  children,
}: {
  children: React.ReactNode | React.ReactNode[];
}) => {
  return (
    <div>
      <ClientRouteGuard
        loginPath={'/login'}
        publicPaths={PokeHubRouter.publicRoutes}
        redirectOnLogin={PokeHubRouter.redirectOnLogin}
        privilegedRoutes={PokeHubRouter.privilegedRoutes}
      >
        <AppNav />
        {children}
      </ClientRouteGuard>
    </div>
  );
};
