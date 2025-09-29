'use client';

import { PokeHubRouter } from '../../router';
import { AppNav } from '@pokehub/frontend/pokehub-nav-components';
import { ClientRouteGuard } from '@pokehub/frontend/shared-app-router';
import { createFetchClient } from '@pokehub/frontend/shared-data-provider';
import { Toaster } from '@pokehub/frontend/shared-ui-components';
import { useEffect } from 'react';

export const App = ({
  children,
}: {
  children: React.ReactNode | React.ReactNode[];
}) => {
  useEffect(() => {
    createFetchClient('NEXT_API', window.location.origin);
  }, []);

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
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                'group toast group-[.toaster]:bg-background/50 group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-xl',
              description: 'group-[.toast]:text-muted-foreground',
              actionButton:
                'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
              cancelButton:
                'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
            },
          }}
        />
      </ClientRouteGuard>
    </div>
  );
};
