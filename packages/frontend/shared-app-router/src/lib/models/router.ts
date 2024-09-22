import { UserCoreAccountRole } from '@pokehub/shared/shared-user-models';

export interface PrivilegedAuthRoute {
  route: string;
  rolesAllowed?: UserCoreAccountRole[];
}

export interface PublicRoute {
  route: string;
  isAuthAccessible?: boolean;
}

export type RedirectRoute = {
  [role in UserCoreAccountRole]: string;
};

export type NavAuthRoutes = {
  [role in UserCoreAccountRole]: { path: string; name: string }[];
};

export interface AppRouter {
  publicRoutes: PublicRoute[];
  navAuthRoutes: NavAuthRoutes;
  redirectOnLogin: RedirectRoute;
  privilegedRoutes: PrivilegedAuthRoute[];
}

export interface RouteGuardProps {
  publicPaths: PublicRoute[];
  redirectOnLogin: RedirectRoute;
  privilegedRoutes?: PrivilegedAuthRoute[];
  loginPath: string;
  children: JSX.Element | React.ReactNode;
  onLogout?: () => void;
}
