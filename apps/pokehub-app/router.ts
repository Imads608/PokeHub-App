import type { AppRouter } from '@pokehub/frontend/shared-app-router';

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
    {
      route: '/pokedex',
      isAuthAccessible: true,
    },
  ],
  privilegedRoutes: [
    {
      route: '/create-profile',
      rolesAllowed: ['USER'],
      allowSubRoutes: false,
    },
    {
      route: '/team-builder',
      rolesAllowed: ['USER'],
      allowSubRoutes: true,
    },
    {
      route: '/settings',
      rolesAllowed: ['ADMIN', 'USER'],
      allowSubRoutes: false,
    },
  ],
  redirectOnLogin: {
    ADMIN: '/team-builder',
    USER: '/team-builder',
  },
  createUsernameRoute: '/create-profile',
};
