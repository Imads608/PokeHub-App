import type { UserAccountRole } from '@pokehub/shared/shared-user-models';
import type { Session } from 'next-auth';

export interface PrivilegedAuthRoute {
  route: string;
  rolesAllowed?: UserAccountRole[];
  allowSubRoutes?: boolean;
}

export interface PublicRoute {
  route: string;
  isAuthAccessible?: boolean;
}

export type RedirectRoute = {
  [role in UserAccountRole]: string;
};

export type NavAuthRoutes = {
  [role in UserAccountRole]: { path: string; name: string }[];
};

export interface AppRouter {
  publicRoutes: PublicRoute[];
  //navAuthRoutes: NavAuthRoutes;
  redirectOnLogin: RedirectRoute;
  privilegedRoutes: PrivilegedAuthRoute[];
  createUsernameRoute: string;
}

export interface RouteGuardProps {
  publicPaths: PublicRoute[];
  redirectOnLogin: RedirectRoute;
  privilegedRoutes?: PrivilegedAuthRoute[];
  loginPath: string;
  children: JSX.Element | React.ReactNode;
  onLogout?: () => void;
}

export interface ServerRouteGuardProps {
  getSessionCallback: () => Promise<Session | null>;
  router: AppRouter;
}
