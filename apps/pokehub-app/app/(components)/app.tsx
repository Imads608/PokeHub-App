'use client';

import { PokeHubRouter } from '../../router';
import { AppNav } from '@pokehub/frontend/pokehub-nav-components';
import { ClientRouteGuard } from '@pokehub/frontend/shared-app-router';
import { useQueryClient } from '@tanstack/react-query';

export const App = ({
  children,
}: {
  children: React.ReactNode | React.ReactNode[];
}) => {
  const queryClient = useQueryClient();
  return (
    <div>
      <ClientRouteGuard
        loginPath="/login"
        publicPaths={PokeHubRouter.publicRoutes}
        redirectOnLogin={PokeHubRouter.redirectOnLogin}
        privilegedRoutes={PokeHubRouter.privilegedRoutes}
        onLogout={() => queryClient.clear()}
      >
        <AppNav />
        {children}
      </ClientRouteGuard>
    </div>
  );
};
