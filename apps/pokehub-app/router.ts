import { AppRouter } from '@pokehub/frontend/shared-app-router';

export const PokeHubRouter: AppRouter = {
  publicRoutes: [
    {
      route: '/',
      isAuthAccessible: false,
    },
    {
      route: '/login',
      isAuthAccessible: false,
    },
    {
      route: '/register',
      isAuthAccessible: false,
    },
  ],
  navAuthRoutes: {
    ADMIN: [
      {
        name: 'Dashboard',
        path: '/dash',
      },
    ],
    USER: [
      {
        name: 'Dashboard',
        path: '/dash',
      },
    ],
  },
  privilegedRoutes: [
    {
      route: '/dash',
      rolesAllowed: ['ADMIN', 'USER'],
      allowSubRoutes: true,
    },
  ],
  redirectOnLogin: {
    ADMIN: '/dash',
    USER: '/dash',
  },
};
