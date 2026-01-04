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
      route: '/dashboard',
      rolesAllowed: ['ADMIN', 'USER'],
      allowSubRoutes: true,
    },
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
    ADMIN: '/dashboard',
    USER: '/dashboard',
  },
  createUsernameRoute: '/create-profile',
};
